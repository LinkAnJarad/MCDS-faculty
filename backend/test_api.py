import asyncio
import httpx

async def test():
    async with httpx.AsyncClient() as client:
        resp = await client.get("http://127.0.0.1:8000/api/v1/departments/")
        print("GET /departments/:", resp.status_code, resp.text)
        
asyncio.run(test())
