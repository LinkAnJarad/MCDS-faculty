"""
Clerk JWT verification for FastAPI.

Every exception is caught and converted to a proper HTTPException so
FastAPI always returns a JSON error body (never a plain-text 500).

Key improvements over the previous version:
- Fetches JWKS only once and caches it (cleared on any failure).
- Properly extracts the matching RSA key by `kid` from the JWKS set.
- Falls back to the first available key when `kid` is absent.
- Wraps ALL non-HTTPException errors so none escape to Starlette's
  plain-text ServerErrorMiddleware.
"""

from __future__ import annotations

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt

from app.core.config import settings

bearer_scheme = HTTPBearer(auto_error=False)

_jwks_cache: dict | None = None


async def _get_jwks() -> dict:
    """Fetch Clerk's JSON Web Key Set and cache it for the lifetime of the process."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(settings.CLERK_JWKS_URL)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as exc:
        raise RuntimeError(
            f"JWKS endpoint returned {exc.response.status_code}. "
            f"Check CLERK_JWKS_URL in backend/.env."
        ) from exc
    except httpx.RequestError as exc:
        raise RuntimeError(
            f"Could not reach JWKS endpoint ({settings.CLERK_JWKS_URL}). "
            f"Network error: {exc.__class__.__name__}: {exc}"
        ) from exc

    if "keys" not in data or not data["keys"]:
        raise RuntimeError(
            f"JWKS response from {settings.CLERK_JWKS_URL} contains no keys."
        )

    _jwks_cache = data
    return _jwks_cache


def _pick_public_key(jwks: dict, kid: str | None):
    """
    Select the RSA public key from the JWKS that matches the token's `kid`.
    Falls back to the first key when `kid` is not present or not matched.
    """
    keys: list[dict] = jwks.get("keys", [])
    if not keys:
        raise ValueError("JWKS has no keys — cannot verify token.")

    if kid:
        candidates = [k for k in keys if k.get("kid") == kid]
        if candidates:
            return jwk.construct(candidates[0], algorithm="RS256")
        # kid not matched → fall through to first available key

    return jwk.construct(keys[0], algorithm="RS256")


async def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    """
    FastAPI dependency — verifies the Clerk JWT in the Authorization header.

    Returns the decoded token payload dict on success.
    Always raises HTTPException (JSON body) on failure.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # ── Step 1: fetch JWKS (cached) ──────────────────────────────────────────
    try:
        jwks = await _get_jwks()
    except Exception as exc:
        global _jwks_cache
        _jwks_cache = None          # clear so next request retries
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"Authentication service unavailable. "
                f"Verify CLERK_JWKS_URL in backend/.env. Detail: {exc}"
            ),
        ) from exc

    # ── Step 2: extract matching public key ───────────────────────────────────
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        public_key = _pick_public_key(jwks, kid)
    except Exception as exc:
        _jwks_cache = None          # may be stale — refresh on next attempt
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not extract verification key from JWKS: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    # ── Step 3: verify and decode ─────────────────────────────────────────────
    try:
        payload: dict = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except Exception as exc:
        # Catches any unexpected jose / key errors — ensures JSON response
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed ({exc.__class__.__name__}): {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_user_role(payload: dict = Depends(require_auth)) -> str:
    """Extract the Clerk `publicMetadata.role` from the decoded payload."""
    metadata = payload.get("publicMetadata") or payload.get("public_metadata", {})
    return metadata.get("role", "hr_personnel")
