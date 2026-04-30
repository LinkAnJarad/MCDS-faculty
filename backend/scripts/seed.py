import sys
import os
import uuid
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.models.department import Department
from app.models.position import Position
from app.models.criteria import Criteria
from app.models.applicant import Applicant, HighestDegree, ApplicantStatus
from app.models.allocation import Allocation

def seed_db():
    db = SessionLocal()
    try:
        print("Starting DB seed cleanup...")
        # Clear in order of dependencies (child to parent)
        db.query(Allocation).delete()
        db.query(Applicant).delete()
        db.query(Position).delete()
        db.query(Criteria).delete()
        db.query(Department).delete()
        db.commit()
        print("Existing data cleared.")

        # 1. Departments
        print("Seeding Departments...")
        ccs = Department(name="College of Computer Studies", code="CCS", description="Computing, IT, and Software Engineering.")
        coe = Department(name="College of Engineering", code="COE", description="Mechanical, Electrical, and Civil Engineering.")
        cos = Department(name="College of Science", code="COS", description="Pure and Applied Sciences (Math, Physics, Biology).")
        cba = Department(name="College of Business and Accountancy", code="CBA", description="Management, Finance, and Marketing.")
        
        db.add_all([ccs, coe, cos, cba])
        db.flush()

        # 2. Positions
        print("Seeding Positions...")
        positions = [
            Position(title="Assistant Professor (Web Tech)", department_id=ccs.id, required_units=12, requires_phd=False, is_open=True),
            Position(title="Associate Professor (Cybersecurity)", department_id=ccs.id, required_units=15, requires_phd=True, is_open=True),
            Position(title="Professor (Structural Engineering)", department_id=coe.id, required_units=12, requires_phd=True, is_open=True),
            Position(title="Lecturer (Mathematics)", department_id=cos.id, required_units=18, requires_phd=False, is_open=True),
            Position(title="Assistant Professor (Quantum Physics)", department_id=cos.id, required_units=12, requires_phd=True, is_open=True),
            Position(title="Associate Professor (Financial Management)", department_id=cba.id, required_units=15, requires_phd=True, is_open=True),
            Position(title="Assistant Professor (Marketing)", department_id=cba.id, required_units=15, requires_phd=False, is_open=True),
        ]
        db.add_all(positions)
        db.flush()

        # 3. Criteria
        print("Seeding Criteria...")
        criteria = [
            Criteria(name="Highest Degree Achieved", description="Doctorate (100), Masters (70), Bachelors (40)", weight=35.0, data_key="highest_degree", is_active=True),
            Criteria(name="Teaching Experience (Years)", description="Score based on total years in academia.", weight=25.0, data_key="years_experience", is_active=True),
            Criteria(name="Research & Publications", description="Count of Scopus/WoS indexed papers.", weight=25.0, data_key="research_outputs", is_active=True),
            Criteria(name="Industry Certifications", description="Relevant industry certifications.", weight=15.0, data_key="certifications", is_active=True),
        ]
        db.add_all(criteria)
        db.flush()

        # 4. Applicants
        print("Seeding Applicants...")
        # Create some applicants for CCS
        ccs_apps = [
            Applicant(first_name="John", last_name="Doe", email="john.doe@university.edu", highest_degree=HighestDegree.doctorate, years_experience=10, research_outputs=15, certifications=4, specialization="Computer Science", teaching_units_available=12, status=ApplicantStatus.shortlisted),
            Applicant(first_name="Jane", last_name="Smith", email="jane.smith@it-pro.com", highest_degree=HighestDegree.masters, years_experience=5, research_outputs=3, certifications=8, specialization="Cybersecurity", teaching_units_available=15, status=ApplicantStatus.pending),
            Applicant(first_name="Alan", last_name="Turing", email="alan.t@logic.org", highest_degree=HighestDegree.post_doctorate, years_experience=20, research_outputs=50, certifications=0, specialization="Cryptography", teaching_units_available=10, status=ApplicantStatus.shortlisted),
        ]
        
        # Create some applicants for COE
        coe_apps = [
            Applicant(first_name="Emily", last_name="Roebling", email="emily.r@bridge.edu", highest_degree=HighestDegree.masters, years_experience=12, research_outputs=8, certifications=5, specialization="Civil Engineering", teaching_units_available=15, status=ApplicantStatus.shortlisted),
            Applicant(first_name="Nikola", last_name="Tesla", email="nikola.t@energy.com", highest_degree=HighestDegree.doctorate, years_experience=15, research_outputs=30, certifications=10, specialization="Electrical Engineering", teaching_units_available=12, status=ApplicantStatus.pending),
        ]

        # Create some applicants for COS
        cos_apps = [
            Applicant(first_name="Marie", last_name="Curie", email="marie.c@science.fr", highest_degree=HighestDegree.post_doctorate, years_experience=18, research_outputs=45, certifications=2, specialization="Physics", teaching_units_available=9, status=ApplicantStatus.shortlisted),
            Applicant(first_name="Isaac", last_name="Newton", email="isaac.n@gravity.uk", highest_degree=HighestDegree.doctorate, years_experience=25, research_outputs=40, certifications=0, specialization="Mathematics", teaching_units_available=15, status=ApplicantStatus.pending),
            Applicant(first_name="Katherine", last_name="Johnson", email="katherine.j@nasa.gov", highest_degree=HighestDegree.masters, years_experience=10, research_outputs=12, certifications=3, specialization="Mathematics", teaching_units_available=18, status=ApplicantStatus.shortlisted),
        ]

        # Create some applicants for CBA
        cba_apps = [
            Applicant(first_name="Warren", last_name="Buffett", email="warren.b@value.com", highest_degree=HighestDegree.masters, years_experience=40, research_outputs=5, certifications=1, specialization="Finance", teaching_units_available=12, status=ApplicantStatus.pending),
            Applicant(first_name="Sheryl", last_name="Sandberg", email="sheryl.s@leanin.org", highest_degree=HighestDegree.masters, years_experience=15, research_outputs=10, certifications=4, specialization="Management", teaching_units_available=15, status=ApplicantStatus.shortlisted),
        ]

        all_applicants = ccs_apps + coe_apps + cos_apps + cba_apps
        db.add_all(all_applicants)
        
        db.commit()
        print(f"Database seeded successfully with {len(all_applicants)} applicants and {len(positions)} positions!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
