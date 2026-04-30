from app.db.session import SessionLocal
from app.crud.department import get_by_code
from app.schemas.department import DepartmentResponse

db = SessionLocal()
try:
    dept = get_by_code(db, "TST2")
    if dept:
        resp = DepartmentResponse.model_validate(dept)
        print("Serialization success:", resp.model_dump_json())
    else:
        print("Department not found")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
