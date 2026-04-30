from fastapi import APIRouter

from app.api.v1.endpoints import health, departments, positions, applicants, criteria, evaluation, optimization

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router,        prefix="/health",        tags=["Health"])
api_router.include_router(departments.router,   prefix="/departments",   tags=["Departments"])
api_router.include_router(positions.router,     prefix="/positions",     tags=["Positions"])
api_router.include_router(applicants.router,    prefix="/applicants",    tags=["Applicants"])
api_router.include_router(criteria.router,      prefix="/criteria",      tags=["Criteria"])
api_router.include_router(evaluation.router,    prefix="/evaluation",    tags=["Evaluation"])
api_router.include_router(optimization.router,  prefix="/optimization",  tags=["Optimization"])
