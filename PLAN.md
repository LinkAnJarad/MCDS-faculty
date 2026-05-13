System Description
The proposed system is a Multi-Criteria Decision Support System (MCDSS) designed to assist higher education institutions in faculty hiring and teaching load allocation. It provides a structured, data-driven approach to evaluating applicants and assigning faculty based on configurable criteria and institutional constraints.
The system supports two primary workflows:
1. Faculty Hiring (External Applicants)
Applicants submit their information through a configurable application form. The system evaluates each applicant using a Weighted Sum Model (WSM), where multiple criteria (e.g., education, teaching experience, research output) are assigned weights and aggregated into a final score. Applicants are then ranked based on this score.
To support decision-making beyond simple ranking, the system applies Integer Linear Programming (ILP) to determine the optimal selection of candidates for available positions. This ensures that hiring decisions satisfy constraints such as the number of available slots, specialization requirements, and institutional policies, while maximizing overall candidate quality.

2. Faculty Allocation (Internal Staff)
Existing faculty members provide updated information regarding their qualifications, availability, and preferred workload. Similar to applicant evaluation, the system can score faculty members using configurable criteria.
An ILP-based optimization model is then used to assign faculty to courses or roles. This model considers constraints such as:
Maximum teaching load per faculty member
Subject expertise and qualifications
Departmental requirements
The objective is to produce an optimal allocation that balances workload and maximizes alignment between faculty expertise and assigned responsibilities.

Key Features
Configurable Criteria and Weights
Administrators can define and modify evaluation criteria and their corresponding weights without requiring code changes.
Dynamic Application Forms
Application forms are automatically generated based on defined criteria, ensuring consistency between collected data and evaluation metrics.
Automated Scoring and Ranking
Candidates and faculty are evaluated using a transparent scoring system (WSM), with detailed breakdowns available for each criterion.
Optimization-Based Decision Support
ILP is used to determine the best combination of hires and faculty assignments under real-world constraints.
Role-Based Access
Different interfaces and permissions are provided for HR personnel, academic directors, applicants, and faculty members.
Explainability and Transparency
Users can view how scores are computed and how decisions are derived from the underlying models.