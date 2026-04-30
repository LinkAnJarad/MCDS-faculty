from app.db.session import SessionLocal
from app.crud.department import create
from app.schemas.department import DepartmentCreate

db = SessionLocal()
try:
    data = DepartmentCreate(name="Test", code="TST", description="Test")
    create(db, data)
    db.commit()
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
