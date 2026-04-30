import asyncio
import httpx

async def test():
    async with httpx.AsyncClient() as client:
        # call the API directly internally using the app
        from app.db.session import SessionLocal
        from app.api.v1.endpoints.optimization import run_optimization
        from app.schemas.optimization import RunOptimizationRequest
        
        db = SessionLocal()
        try:
            req = RunOptimizationRequest(save_allocations=True)
            res = run_optimization(req, db, {})
            print("Optimization API success!")
        except Exception as e:
            import traceback
            traceback.print_exc()
        finally:
            db.close()

asyncio.run(test())
