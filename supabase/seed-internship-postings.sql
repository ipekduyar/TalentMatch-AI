-- Broad demo internship postings for domain-sensitive matching.
-- Target schema inspected from supabase/postings-schema.sql:
-- public.internship_postings(internship_posting_id, company_id, representative_id,
-- title, description, location, industry, required_skills, desired_skills,
-- start_date, duration_weeks, is_paid, monthly_stipend, is_remote, deadline, status).

insert into public.companies (company_id, name, industry, location)
values
  ('c6000000-0000-0000-0000-000000000001', 'EcoSphere Consulting', 'Environmental / Sustainability', 'Istanbul'),
  ('c6000000-0000-0000-0000-000000000002', 'Anatolia Water Technologies', 'Environmental Engineering', 'Kocaeli'),
  ('c6000000-0000-0000-0000-000000000003', 'GreenGrid Energy', 'Renewable Energy', 'Izmir'),
  ('c6000000-0000-0000-0000-000000000004', 'Marmara Chemicals', 'Chemical Manufacturing', 'Gebze'),
  ('c6000000-0000-0000-0000-000000000005', 'NovaPharm R&D', 'Pharmaceuticals', 'Istanbul'),
  ('c6000000-0000-0000-0000-000000000006', 'ByteCraft Labs', 'Software', 'Istanbul'),
  ('c6000000-0000-0000-0000-000000000007', 'Bosporus Robotics', 'Embedded Systems', 'Ankara'),
  ('c6000000-0000-0000-0000-000000000008', 'PeopleFirst Talent', 'Human Resources', 'Istanbul'),
  ('c6000000-0000-0000-0000-000000000009', 'Lexora Legal Advisory', 'Law / Compliance', 'Istanbul'),
  ('c6000000-0000-0000-0000-000000000010', 'FinSight Analytics', 'Finance / Business', 'Istanbul'),
  ('c6000000-0000-0000-0000-000000000011', 'OptiChain Logistics', 'Supply Chain', 'Bursa'),
  ('c6000000-0000-0000-0000-000000000012', 'MarketPulse Digital', 'Marketing Analytics', 'Istanbul')
on conflict (company_id) do nothing;

with demo_postings (
  internship_posting_id,
  company_id,
  title,
  description,
  location,
  industry,
  required_skills,
  desired_skills,
  start_date,
  duration_weeks,
  is_paid,
  monthly_stipend,
  is_remote,
  deadline,
  status
) as (
  values
  -- Environmental / Sustainability
  ('d6000000-0000-0000-0000-000000000001'::uuid, 'c6000000-0000-0000-0000-000000000001'::uuid, 'Environmental Engineering Intern', 'Support environmental impact assessments, site data collection, permitting research, and sustainability reports for industrial clients.', 'Istanbul', 'Environmental / Sustainability', array['Environmental Impact Assessment','Water Quality Analysis','Sustainability','Excel'], array['GIS','ESG Reporting','Turkish Environmental Regulation'], '2026-07-13'::date, 10, true, 18000::numeric, false, '2026-08-15'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000002'::uuid, 'c6000000-0000-0000-0000-000000000001'::uuid, 'Sustainability & ESG Intern', 'Prepare ESG data packs, benchmark sustainability disclosures, and help calculate Scope 1, 2, and selected Scope 3 emissions.', 'Istanbul', 'Environmental / Sustainability', array['Sustainability','ESG Reporting','Carbon Footprint','Excel'], array['Power BI','Life Cycle Assessment','GRI Standards'], '2026-07-20'::date, 12, true, 19000::numeric, true, '2026-08-20'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000003'::uuid, 'c6000000-0000-0000-0000-000000000002'::uuid, 'Water Treatment Intern', 'Assist engineers with sampling plans, wastewater treatment process monitoring, water quality analysis, and operational improvement notes.', 'Kocaeli', 'Environmental Engineering', array['Water Treatment','Water Quality Analysis','Environmental Engineering','Laboratory Safety'], array['Wastewater Treatment','AutoCAD','Process Monitoring'], '2026-08-03'::date, 12, true, 17500::numeric, false, '2026-08-25'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000004'::uuid, 'c6000000-0000-0000-0000-000000000003'::uuid, 'Renewable Energy Analysis Intern', 'Analyze solar and wind generation data, prepare feasibility summaries, and support energy efficiency project documentation.', 'Izmir', 'Renewable Energy', array['Renewable Energy','Data Analysis','Excel','Sustainability'], array['Python','Power BI','Energy Modeling'], '2026-07-27'::date, 10, true, 18000::numeric, true, '2026-08-18'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000005'::uuid, 'c6000000-0000-0000-0000-000000000001'::uuid, 'Carbon Management Intern', 'Help build carbon inventories, validate activity data, document assumptions, and create client-facing decarbonization dashboards.', 'Istanbul', 'Environmental / Sustainability', array['Carbon Footprint','Sustainability','ESG','Data Analysis'], array['GHG Protocol','Power BI','Life Cycle Assessment'], '2026-08-10'::date, 12, true, 19000::numeric, true, '2026-08-30'::date, 'active'),

  -- Chemical / Process
  ('d6000000-0000-0000-0000-000000000006'::uuid, 'c6000000-0000-0000-0000-000000000004'::uuid, 'Process Engineering Intern', 'Work with process engineers on mass balance checks, production yield tracking, equipment observations, and process improvement experiments.', 'Gebze', 'Chemical / Process Engineering', array['Chemical Engineering','Process Engineering','Mass Balance','Excel'], array['Aspen Plus','Lean Manufacturing','Process Safety'], '2026-07-13'::date, 12, true, 20000::numeric, false, '2026-08-15'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000007'::uuid, 'c6000000-0000-0000-0000-000000000004'::uuid, 'R&D Laboratory Intern', 'Support formulation trials, sample preparation, analytical testing, and structured laboratory notebook documentation.', 'Gebze', 'Chemical / R&D', array['Laboratory','HPLC','FTIR','Chemical Engineering'], array['Formulation','Statistical Analysis','Quality Control'], '2026-07-20'::date, 10, true, 18500::numeric, false, '2026-08-17'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000008'::uuid, 'c6000000-0000-0000-0000-000000000004'::uuid, 'Quality Control Intern', 'Perform routine QC documentation, support analytical chemistry tests, prepare control charts, and review nonconformity records.', 'Kocaeli', 'Chemical / Quality Control', array['Quality Control','HPLC','Laboratory Safety','GMP'], array['FTIR','Statistical Quality Control','ISO 9001'], '2026-08-03'::date, 12, true, 18000::numeric, false, '2026-08-23'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000009'::uuid, 'c6000000-0000-0000-0000-000000000004'::uuid, 'Production Intern', 'Track production KPIs, observe shop-floor operations, document standard work, and support root-cause analysis for process losses.', 'Gebze', 'Chemical Manufacturing', array['Production','Process Engineering','Root Cause Analysis','Excel'], array['Lean Six Sigma','SAP','Occupational Safety'], '2026-07-27'::date, 8, true, 17000::numeric, false, '2026-08-19'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000010'::uuid, 'c6000000-0000-0000-0000-000000000005'::uuid, 'Pharmaceutical R&D Intern', 'Assist pharmaceutical scientists with formulation screening, GMP-aware documentation, literature review, and stability study tracking.', 'Istanbul', 'Pharmaceuticals / R&D', array['Pharmaceutical R&D','Laboratory','GMP','HPLC'], array['Formulation','FTIR','Scientific Literature Review'], '2026-08-10'::date, 12, true, 21000::numeric, false, '2026-08-28'::date, 'active'),

  -- Software / Computer
  ('d6000000-0000-0000-0000-000000000011'::uuid, 'c6000000-0000-0000-0000-000000000006'::uuid, 'Frontend Developer Intern', 'Build React components, fix UI defects, write TypeScript code, and collaborate with designers on accessible web experiences.', 'Istanbul', 'Software', array['React','JavaScript','TypeScript','Frontend'], array['CSS','Testing','Figma'], '2026-07-13'::date, 12, true, 22000::numeric, true, '2026-08-16'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000012'::uuid, 'c6000000-0000-0000-0000-000000000006'::uuid, 'Backend Developer Intern', 'Develop REST API endpoints, write database queries, improve service tests, and document backend integration behavior.', 'Istanbul', 'Software', array['Node.js','REST API','SQL','Backend'], array['PostgreSQL','Docker','TypeScript'], '2026-07-20'::date, 12, true, 23000::numeric, true, '2026-08-18'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000013'::uuid, 'c6000000-0000-0000-0000-000000000006'::uuid, 'Data Science Intern', 'Clean datasets, build exploratory notebooks, validate predictive models, and communicate findings through dashboards.', 'Istanbul', 'Data Science / AI', array['Python','SQL','Machine Learning','Statistics'], array['Pandas','Data Visualization','Power BI'], '2026-07-27'::date, 14, true, 23000::numeric, true, '2026-08-22'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000014'::uuid, 'c6000000-0000-0000-0000-000000000007'::uuid, 'Embedded Systems Intern', 'Prototype firmware for sensor modules, test microcontroller interfaces, and document embedded C/C++ experiments.', 'Ankara', 'Embedded Systems', array['Embedded C','C++','Microcontrollers','Electronics'], array['RTOS','PCB Design','Python'], '2026-08-03'::date, 12, true, 21500::numeric, false, '2026-08-24'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000015'::uuid, 'c6000000-0000-0000-0000-000000000006'::uuid, 'QA/Test Intern', 'Create manual and automated test cases, reproduce bugs, support regression testing, and improve release quality documentation.', 'Istanbul', 'Software Quality Assurance', array['Testing','QA','JavaScript','Problem Solving'], array['Cypress','API Testing','SQL'], '2026-08-10'::date, 10, true, 18500::numeric, true, '2026-08-29'::date, 'active'),

  -- Psychology / HR
  ('d6000000-0000-0000-0000-000000000016'::uuid, 'c6000000-0000-0000-0000-000000000008'::uuid, 'Recruitment Intern', 'Screen candidates, coordinate interviews, write candidate summaries, and support talent acquisition reporting.', 'Istanbul', 'Human Resources', array['Recruitment','Candidate Screening','Communication','Excel'], array['Talent Acquisition','Interview Coordination','LinkedIn Recruiter'], '2026-07-13'::date, 10, true, 16000::numeric, true, '2026-08-15'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000017'::uuid, 'c6000000-0000-0000-0000-000000000008'::uuid, 'People Operations Intern', 'Support onboarding, employee engagement surveys, HR data quality checks, and people operations process documentation.', 'Istanbul', 'Human Resources', array['People Operations','HR','Onboarding','Excel'], array['Employee Engagement','HR Analytics','Process Documentation'], '2026-07-20'::date, 12, true, 16500::numeric, true, '2026-08-18'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000018'::uuid, 'c6000000-0000-0000-0000-000000000008'::uuid, 'Organizational Psychology Intern', 'Apply organizational psychology concepts to survey analysis, competency frameworks, and workplace wellbeing initiatives.', 'Istanbul', 'Psychology / HR', array['Organizational Psychology','Survey Analysis','Employee Research','Communication'], array['SPSS','Training Needs Analysis','HR Analytics'], '2026-08-03'::date, 12, false, null::numeric, true, '2026-08-24'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000019'::uuid, 'c6000000-0000-0000-0000-000000000008'::uuid, 'Training & Development Intern', 'Help design learning materials, track training completion, evaluate feedback, and prepare development program reports.', 'Istanbul', 'Human Resources', array['Training & Development','Presentation','HR','Excel'], array['Instructional Design','Learning Analytics','Facilitation'], '2026-08-10'::date, 10, true, 15500::numeric, true, '2026-08-30'::date, 'active'),

  -- Law / Policy
  ('d6000000-0000-0000-0000-000000000020'::uuid, 'c6000000-0000-0000-0000-000000000009'::uuid, 'Legal Intern', 'Conduct legal research, draft short memoranda, organize case files, and support contract review for commercial matters.', 'Istanbul', 'Law / Legal Services', array['Legal Research','Contract Review','Legal Writing','Communication'], array['Commercial Law','Microsoft Word','Turkish Law'], '2026-07-13'::date, 8, false, null::numeric, false, '2026-08-15'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000021'::uuid, 'c6000000-0000-0000-0000-000000000009'::uuid, 'Compliance Intern', 'Support compliance checklists, regulatory monitoring, risk control evidence collection, and internal policy updates.', 'Istanbul', 'Compliance / Policy', array['Compliance','Regulatory Research','Policy','Excel'], array['Risk Assessment','Audit Documentation','Legal Writing'], '2026-07-20'::date, 10, true, 17000::numeric, true, '2026-08-18'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000022'::uuid, 'c6000000-0000-0000-0000-000000000009'::uuid, 'Data Protection / KVKK Intern', 'Assist privacy impact assessments, KVKK/GDPR documentation, data inventory reviews, and vendor privacy checklist updates.', 'Istanbul', 'Data Protection / Compliance', array['KVKK','GDPR','Data Protection','Legal Research'], array['Privacy Impact Assessment','Contract Review','Information Security Awareness'], '2026-08-03'::date, 12, true, 17500::numeric, true, '2026-08-24'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000023'::uuid, 'c6000000-0000-0000-0000-000000000009'::uuid, 'Policy Research Intern', 'Research public policy developments, prepare policy briefs, map stakeholders, and summarize regulatory impacts for clients.', 'Ankara', 'Policy / Research', array['Policy Research','Legal Writing','Regulatory Analysis','Communication'], array['Public Policy','Data Analysis','International Relations'], '2026-08-10'::date, 10, false, null::numeric, true, '2026-08-30'::date, 'active'),

  -- Finance / Business
  ('d6000000-0000-0000-0000-000000000024'::uuid, 'c6000000-0000-0000-0000-000000000010'::uuid, 'Financial Analyst Intern', 'Build financial models, reconcile monthly data, prepare variance summaries, and support investment committee materials.', 'Istanbul', 'Finance', array['Financial Modeling','Excel','Accounting','Data Analysis'], array['Valuation','PowerPoint','SQL'], '2026-07-13'::date, 12, true, 21000::numeric, true, '2026-08-15'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000025'::uuid, 'c6000000-0000-0000-0000-000000000010'::uuid, 'Business Intelligence Intern', 'Develop KPI dashboards, write SQL queries, validate business metrics, and present insights to operations teams.', 'Istanbul', 'Business Intelligence', array['SQL','Power BI','Data Analysis','Business Intelligence'], array['Python','Data Visualization','Statistics'], '2026-07-20'::date, 14, true, 22000::numeric, true, '2026-08-18'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000026'::uuid, 'c6000000-0000-0000-0000-000000000010'::uuid, 'Risk Intern', 'Monitor risk indicators, document control tests, prepare scenario analysis, and support reporting for credit and operational risk.', 'Istanbul', 'Finance / Risk', array['Risk Analysis','Excel','Finance','Statistics'], array['SQL','Regulatory Reporting','Audit'], '2026-07-27'::date, 12, true, 20000::numeric, true, '2026-08-22'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000027'::uuid, 'c6000000-0000-0000-0000-000000000012'::uuid, 'Marketing Analytics Intern', 'Analyze campaign performance, build acquisition dashboards, and translate customer behavior data into marketing recommendations.', 'Istanbul', 'Marketing Analytics', array['Marketing Analytics','Google Analytics','Excel','Data Analysis'], array['SQL','A/B Testing','Power BI'], '2026-08-03'::date, 10, true, 17500::numeric, true, '2026-08-24'::date, 'active'),
  ('d6000000-0000-0000-0000-000000000028'::uuid, 'c6000000-0000-0000-0000-000000000011'::uuid, 'Supply Chain Intern', 'Support demand planning, inventory analysis, supplier KPI reporting, and logistics process improvement projects.', 'Bursa', 'Supply Chain / Operations', array['Supply Chain','Excel','Operations','Data Analysis'], array['Forecasting','Power BI','Lean Six Sigma'], '2026-08-10'::date, 12, true, 18000::numeric, false, '2026-08-30'::date, 'active')
)
insert into public.internship_postings (
  internship_posting_id,
  company_id,
  title,
  description,
  location,
  industry,
  required_skills,
  desired_skills,
  start_date,
  duration_weeks,
  is_paid,
  monthly_stipend,
  is_remote,
  deadline,
  status
)
select
  internship_posting_id,
  company_id,
  title,
  description,
  location,
  industry,
  required_skills,
  desired_skills,
  start_date,
  duration_weeks,
  is_paid,
  monthly_stipend,
  is_remote,
  deadline,
  status
from demo_postings dp
where not exists (
  select 1
  from public.internship_postings ip
  where ip.internship_posting_id = dp.internship_posting_id
     or (lower(ip.title) = lower(dp.title) and ip.company_id = dp.company_id)
);
