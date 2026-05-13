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
            Position(title="Assistant Professor (Web Tech)", department_id=ccs.id, required_units=12, requires_phd=False, required_specialization="Computer Science", is_open=True),
            Position(title="Associate Professor (Cybersecurity)", department_id=ccs.id, required_units=15, requires_phd=True, required_specialization="Cybersecurity", is_open=True),
            Position(title="Professor (Structural Engineering)", department_id=coe.id, required_units=12, requires_phd=True, required_specialization="Civil Engineering", is_open=True),
            Position(title="Lecturer (Mathematics)", department_id=cos.id, required_units=18, requires_phd=False, required_specialization="Mathematics", is_open=True),
            Position(title="Assistant Professor (Quantum Physics)", department_id=cos.id, required_units=12, requires_phd=True, required_specialization="Physics", is_open=True),
            Position(title="Associate Professor (Financial Management)", department_id=cba.id, required_units=15, requires_phd=True, required_specialization="Finance", is_open=True),
            Position(title="Assistant Professor (Marketing)", department_id=cba.id, required_units=15, requires_phd=False, required_specialization="Marketing", is_open=True),
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
        
        # CCS Applicants
        ccs_apps = [
            # High score, but doesn't have a PhD, so optimizer won't assign to the Cybersecurity Professor role
            Applicant(first_name="Marcus", last_name="Chen", email="marcus.c@tech-corp.com", highest_degree=HighestDegree.masters, specialization="Computer Science", teaching_units_available=15, status=ApplicantStatus.shortlisted, is_internal=False, dynamic_data={"years_experience": 15, "research_outputs": 20, "certifications": 8}),
            # Meets PhD requirement, external (can only take 1 role)
            Applicant(first_name="Dr. Elena", last_name="Rostova", email="elena.r@university.edu", highest_degree=HighestDegree.doctorate, specialization="Cybersecurity", teaching_units_available=15, status=ApplicantStatus.shortlisted, is_internal=False, dynamic_data={"years_experience": 8, "research_outputs": 15, "certifications": 5}),
            # Internal candidate, can take multiple roles if units allow (e.g., 27 units available)
            Applicant(first_name="Dr. Samuel", last_name="Oak", email="samuel.o@university.edu", highest_degree=HighestDegree.doctorate, specialization="Computer Science", teaching_units_available=27, status=ApplicantStatus.pending, is_internal=True, dynamic_data={"years_experience": 12, "research_outputs": 25, "certifications": 3}),
            # Has PhD but strictly low teaching units available
            Applicant(first_name="Dr. Chloe", last_name="Price", email="chloe.p@startup.io", highest_degree=HighestDegree.post_doctorate, specialization="Cybersecurity", teaching_units_available=6, status=ApplicantStatus.pending, is_internal=False, dynamic_data={"years_experience": 4, "research_outputs": 35, "certifications": 2}),
        ]
        
        # COE Applicants
        coe_apps = [
            # Exact specialization match
            Applicant(first_name="Dr. Robert", last_name="Hale", email="robert.h@buildcorp.net", highest_degree=HighestDegree.doctorate, specialization="Civil Engineering", teaching_units_available=15, status=ApplicantStatus.shortlisted, is_internal=False, dynamic_data={"years_experience": 12, "research_outputs": 8, "certifications": 5}),
            # High score, but wrong specialization (Electrical)
            Applicant(first_name="Dr. Ananya", last_name="Sharma", email="ananya.s@grid.com", highest_degree=HighestDegree.doctorate, specialization="Electrical Engineering", teaching_units_available=12, status=ApplicantStatus.pending, is_internal=False, dynamic_data={"years_experience": 15, "research_outputs": 30, "certifications": 10}),
            # Junior applicant
            Applicant(first_name="Miguel", last_name="Santos", email="miguel.s@alumni.edu", highest_degree=HighestDegree.bachelors, specialization="Civil Engineering", teaching_units_available=21, status=ApplicantStatus.pending, is_internal=False, dynamic_data={"years_experience": 3, "research_outputs": 0, "certifications": 1}),
        ]

        # COS Applicants
        cos_apps = [
            Applicant(first_name="Dr. Wei", last_name="Lin", email="wei.lin@research.org", highest_degree=HighestDegree.post_doctorate, specialization="Physics", teaching_units_available=12, status=ApplicantStatus.shortlisted, is_internal=True, dynamic_data={"years_experience": 18, "research_outputs": 45, "certifications": 2}),
            Applicant(first_name="Dr. Sarah", last_name="Jenkins", email="s.jenkins@math-institute.uk", highest_degree=HighestDegree.doctorate, specialization="Mathematics", teaching_units_available=15, status=ApplicantStatus.pending, is_internal=False, dynamic_data={"years_experience": 25, "research_outputs": 40, "certifications": 0}),
            Applicant(first_name="David", last_name="Miller", email="d.miller@school.edu", highest_degree=HighestDegree.masters, specialization="Mathematics", teaching_units_available=18, status=ApplicantStatus.shortlisted, is_internal=False, dynamic_data={"years_experience": 10, "research_outputs": 12, "certifications": 3}),
            # Incredible researcher, but only available for very limited teaching
            Applicant(first_name="Dr. Yuri", last_name="Kovalev", email="yuri.k@space.gov", highest_degree=HighestDegree.post_doctorate, specialization="Physics", teaching_units_available=3, status=ApplicantStatus.pending, is_internal=False, dynamic_data={"years_experience": 20, "research_outputs": 80, "certifications": 5}),
        ]

        # CBA Applicants
        cba_apps = [
            Applicant(first_name="Olivia", last_name="Benson", email="olivia.b@finance-group.com", highest_degree=HighestDegree.masters, specialization="Finance", teaching_units_available=18, status=ApplicantStatus.pending, is_internal=True, dynamic_data={"years_experience": 14, "research_outputs": 5, "certifications": 7}),
            Applicant(first_name="James", last_name="Wilson", email="james.w@marketing-agency.net", highest_degree=HighestDegree.masters, specialization="Marketing", teaching_units_available=15, status=ApplicantStatus.shortlisted, is_internal=False, dynamic_data={"years_experience": 15, "research_outputs": 10, "certifications": 4}),
            Applicant(first_name="Dr. Arthur", last_name="Pendleton", email="apendleton@u.edu", highest_degree=HighestDegree.doctorate, specialization="Finance", teaching_units_available=15, status=ApplicantStatus.pending, is_internal=False, dynamic_data={"years_experience": 8, "research_outputs": 14, "certifications": 9}),
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
