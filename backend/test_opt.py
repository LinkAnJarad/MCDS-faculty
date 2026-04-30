import asyncio
import httpx

async def test():
    async with httpx.AsyncClient() as client:
        # We can bypass the API and call the engine directly to get the python stack trace
        from app.db.session import SessionLocal
        from app.crud.applicant import get_all as get_all_applicants
        from app.crud.position import get_all as get_all_positions
        from app.engines.optimizer import run_optimization
        
        db = SessionLocal()
        apps = get_all_applicants(db)
        positions = get_all_positions(db)
        try:
            res = run_optimization(apps, positions)
            print("Optimization success!")
            print(res)
        except Exception as e:
            import traceback
            traceback.print_exc()
        finally:
            db.close()

asyncio.run(test())
