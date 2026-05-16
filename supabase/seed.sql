-- Deterministic seed data for TalentMatch AI

insert into public.persons (person_id, auth_user_id, first_name, last_name, email, role, kvkk_consent, kvkk_consent_at, created_at, is_active, avatar_url) values
('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','İpek','Duyar','ipek@example.com','student',true,'2024-01-01T00:00:00Z','2024-01-01T00:00:00Z',true,'https://api.dicebear.com/7.x/avataaars/svg?seed=Ipek'),
('22222222-2222-2222-2222-222222222222','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','Beyza','Dönmez','beyza@example.com','student',true,'2024-01-01T00:00:00Z','2024-01-01T00:00:00Z',true,'https://api.dicebear.com/7.x/avataaars/svg?seed=Beyza'),
('33333333-3333-3333-3333-333333333333','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3','Ahmet','HR','ahmet@garanti.com','company_rep',true,'2024-01-01T00:00:00Z','2024-01-01T00:00:00Z',true,'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmet'),
('44444444-4444-4444-4444-444444444444','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4','Trendyol','HR','hr@trendyol.com','company_rep',true,'2024-01-01T00:00:00Z','2024-01-01T00:00:00Z',true,'https://api.dicebear.com/7.x/avataaars/svg?seed=TrendyolHR'),
('55555555-5555-5555-5555-555555555555','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5','Demo','Admin','admin@talentmatch.ai','admin',true,'2024-01-01T00:00:00Z','2024-01-01T00:00:00Z',true,'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin')
on conflict (person_id) do nothing;

insert into public.students (student_id, person_id, university, department, student_number, gpa, academic_year, graduation_date, career_goal, cv_file_path, cv_parsed_text, is_edu_verified, profile_complete) values
('aaaa1111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111','ITU','Industrial Engineering','123456789',3.45,4,'2024-06-30','Product Management','/cvs/ipek.pdf',null,true,true),
('aaaa2222-2222-2222-2222-222222222222','22222222-2222-2222-2222-222222222222','ITU','Computer Engineering','987654321',3.21,4,'2024-06-30','Data Science','/cvs/beyza.pdf',null,true,true)
on conflict (student_id) do nothing;

insert into public.companies (company_id, name, industry, size, website, location, description, logo_url, is_premium, is_approved, avg_evaluation_score, created_at) values
('c1111111-1111-1111-1111-111111111111','Garanti BBVA','Finance','enterprise','https://www.garantibbva.com.tr','Istanbul','Leading bank in Turkey.','https://api.dicebear.com/7.x/initials/svg?seed=GB',true,true,4.30,'2024-01-01T00:00:00Z'),
('c2222222-2222-2222-2222-222222222222','Trendyol','Technology','enterprise','https://www.trendyol.com','Istanbul','Biggest e-commerce platform.','https://api.dicebear.com/7.x/initials/svg?seed=TY',true,true,4.10,'2024-01-01T00:00:00Z'),
('c3333333-3333-3333-3333-333333333333','Getir','Technology','enterprise','https://getir.com','Istanbul','Quick commerce and delivery platform.','https://api.dicebear.com/7.x/initials/svg?seed=GET',false,true,4.00,'2024-01-01T00:00:00Z'),
('c4444444-4444-4444-4444-444444444444','Türk Telekom','Telecommunications','enterprise','https://www.turktelekom.com.tr','Ankara','National telecommunications company.','https://api.dicebear.com/7.x/initials/svg?seed=TT',false,true,4.05,'2024-01-01T00:00:00Z'),
('c5555555-5555-5555-5555-555555555555','Arçelik','Manufacturing','enterprise','https://www.arcelikglobal.com','Istanbul','Global durable consumer goods company.','https://api.dicebear.com/7.x/initials/svg?seed=AR',false,true,4.02,'2024-01-01T00:00:00Z')
on conflict (company_id) do nothing;

insert into public.company_representatives (rep_id, person_id, company_id, job_title, is_verified) values
('r1111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333','c1111111-1111-1111-1111-111111111111','HR Manager',true),
('r2222222-2222-2222-2222-222222222222','44444444-4444-4444-4444-444444444444','c2222222-2222-2222-2222-222222222222','HR Specialist',true)
on conflict (rep_id) do nothing;

insert into public.skills (skill_id, name, category, description) values
('s0000001-0000-0000-0000-000000000001','Python','technical',null),
('s0000002-0000-0000-0000-000000000002','JavaScript','technical',null),
('s0000003-0000-0000-0000-000000000003','TypeScript','technical',null),
('s0000004-0000-0000-0000-000000000004','SQL','technical',null),
('s0000005-0000-0000-0000-000000000005','React','technical',null),
('s0000006-0000-0000-0000-000000000006','Node.js','technical',null),
('s0000007-0000-0000-0000-000000000007','Pandas','technical',null),
('s0000008-0000-0000-0000-000000000008','Agile','domain',null),
('s0000009-0000-0000-0000-000000000009','Product Management','domain',null),
('s0000010-0000-0000-0000-000000000010','Communication','soft',null)
on conflict (skill_id) do nothing;

insert into public.student_skills (student_skill_id, student_id, skill_id, proficiency, verified, added_at) values
('ss000001-0000-0000-0000-000000000001','aaaa1111-1111-1111-1111-111111111111','s0000009-0000-0000-0000-000000000009',4,true,'2024-01-10T00:00:00Z'),
('ss000002-0000-0000-0000-000000000002','aaaa1111-1111-1111-1111-111111111111','s0000008-0000-0000-0000-000000000008',3,true,'2024-01-10T00:00:00Z'),
('ss000003-0000-0000-0000-000000000003','aaaa1111-1111-1111-1111-111111111111','s0000010-0000-0000-0000-000000000010',4,true,'2024-01-10T00:00:00Z'),
('ss000004-0000-0000-0000-000000000004','aaaa2222-2222-2222-2222-222222222222','s0000001-0000-0000-0000-000000000001',4,true,'2024-01-10T00:00:00Z'),
('ss000005-0000-0000-0000-000000000005','aaaa2222-2222-2222-2222-222222222222','s0000004-0000-0000-0000-000000000004',4,true,'2024-01-10T00:00:00Z'),
('ss000006-0000-0000-0000-000000000006','aaaa2222-2222-2222-2222-222222222222','s0000007-0000-0000-0000-000000000007',3,true,'2024-01-10T00:00:00Z')
on conflict (student_skill_id) do nothing;

insert into public.internship_postings (posting_id, company_id, rep_id, title, description, location, industry, start_date, duration_weeks, is_paid, monthly_stipend_try, is_remote, status, created_at, deadline) values
('p1111111-1111-1111-1111-111111111111','c1111111-1111-1111-1111-111111111111','r1111111-1111-1111-1111-111111111111','Product Management Intern','Join our digital banking team focused on UX and product lifecycle.','Istanbul','Finance','2024-07-01',12,true,12000,false,'active','2024-04-01T00:00:00Z','2024-06-01'),
('p2222222-2222-2222-2222-222222222222','c2222222-2222-2222-2222-222222222222','r2222222-2222-2222-2222-222222222222','Data Science Intern','Engage with massive datasets and build predictive models.','Istanbul','Technology','2024-07-15',16,true,15000,true,'active','2024-04-05T00:00:00Z','2024-06-15'),
('p3333333-3333-3333-3333-333333333333','c3333333-3333-3333-3333-333333333333','r2222222-2222-2222-2222-222222222222','Growth Analytics Intern','Support growth analytics projects and KPI dashboards.','Istanbul','Technology','2024-08-01',10,true,13000,true,'draft','2024-04-15T00:00:00Z','2024-07-01')
on conflict (posting_id) do nothing;

insert into public.posting_skills (posting_skill_id, posting_id, skill_id, is_required, importance_score, required_level) values
('ps000001-0000-0000-0000-000000000001','p1111111-1111-1111-1111-111111111111','s0000008-0000-0000-0000-000000000008',true,4,3),
('ps000002-0000-0000-0000-000000000002','p1111111-1111-1111-1111-111111111111','s0000009-0000-0000-0000-000000000009',true,5,4),
('ps000003-0000-0000-0000-000000000003','p1111111-1111-1111-1111-111111111111','s0000010-0000-0000-0000-000000000010',true,4,4),
('ps000004-0000-0000-0000-000000000004','p2222222-2222-2222-2222-222222222222','s0000001-0000-0000-0000-000000000001',true,5,4),
('ps000005-0000-0000-0000-000000000005','p2222222-2222-2222-2222-222222222222','s0000004-0000-0000-0000-000000000004',true,4,4),
('ps000006-0000-0000-0000-000000000006','p2222222-2222-2222-2222-222222222222','s0000007-0000-0000-0000-000000000007',false,3,3)
on conflict (posting_skill_id) do nothing;

insert into public.applications (application_id, student_id, posting_id, match_score, status, cover_note, applied_at, updated_at) values
('a1111111-1111-1111-1111-111111111111','aaaa1111-1111-1111-1111-111111111111','p1111111-1111-1111-1111-111111111111',85,'shortlisted','I am very interested in this role.','2024-05-01T00:00:00Z','2024-05-10T00:00:00Z'),
('a2222222-2222-2222-2222-222222222222','aaaa1111-1111-1111-1111-111111111111','p2222222-2222-2222-2222-222222222222',72,'pending','Looking to expand my data skills.','2024-05-12T00:00:00Z','2024-05-12T00:00:00Z'),
('a3333333-3333-3333-3333-333333333333','aaaa2222-2222-2222-2222-222222222222','p2222222-2222-2222-2222-222222222222',88,'reviewed','Excited to work with data products at scale.','2024-05-09T00:00:00Z','2024-05-11T00:00:00Z')
on conflict (application_id) do nothing;

insert into public.skill_gap_reports (report_id, student_id, posting_id, generated_at, summary_text, percentile_rank) values
('g1111111-1111-1111-1111-111111111111','aaaa1111-1111-1111-1111-111111111111','p2222222-2222-2222-2222-222222222222','2024-05-13T08:00:00Z','Strong communication and product thinking; needs stronger technical data stack.',62.5),
('g2222222-2222-2222-2222-222222222222','aaaa2222-2222-2222-2222-222222222222','p1111111-1111-1111-1111-111111111111','2024-05-13T08:10:00Z','Strong technical profile; should improve product communication depth.',70.0)
on conflict (report_id) do nothing;

insert into public.skill_gap_details (gap_detail_id, report_id, skill_id, student_level, required_level, gap_score, urgency) values
('gd000001-0000-0000-0000-000000000001','g1111111-1111-1111-1111-111111111111','s0000001-0000-0000-0000-000000000001',2,4,2,'critical'),
('gd000002-0000-0000-0000-000000000002','g1111111-1111-1111-1111-111111111111','s0000004-0000-0000-0000-000000000004',2,4,2,'critical'),
('gd000003-0000-0000-0000-000000000003','g2222222-2222-2222-2222-222222222222','s0000009-0000-0000-0000-000000000009',2,4,2,'moderate'),
('gd000004-0000-0000-0000-000000000004','g2222222-2222-2222-2222-222222222222','s0000010-0000-0000-0000-000000000010',3,4,1,'low')
on conflict (gap_detail_id) do nothing;

insert into public.learning_resources (resource_id, skill_id, title, provider, url, duration_hours, cost_type, cost_amount_try, avg_rating, level) values
('l1111111-1111-1111-1111-111111111111','s0000008-0000-0000-0000-000000000008','Agile Project Management','Coursera','https://www.coursera.org',20,'paid',800,4.8,'beginner'),
('l2222222-2222-2222-2222-222222222222','s0000009-0000-0000-0000-000000000009','Product Lifecycle Fundamentals','Udemy','https://www.udemy.com',15,'paid',250,4.6,'intermediate'),
('l3333333-3333-3333-3333-333333333333','s0000004-0000-0000-0000-000000000004','SQL for Data Analysis','edX','https://www.edx.org',45,'free',null,4.9,'beginner'),
('l4444444-4444-4444-4444-444444444444','s0000010-0000-0000-0000-000000000010','Communication for Leaders','Coursera','https://www.coursera.org',10,'paid',500,4.7,'intermediate')
on conflict (resource_id) do nothing;

insert into public.notifications (notification_id, person_id, type, title, message, link_url, is_read, created_at) values
('n1111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111','new_match','High Match Found!','A new Product Intern at Trendyol matches 92% of your profile.','/postings/p2222222-2222-2222-2222-222222222222',false,'2024-05-15T10:00:00Z'),
('n2222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','status_update','Application Shortlisted','Garanti BBVA has shortlisted you for the Product Intern role.','/applications',true,'2024-05-10T14:30:00Z'),
('n3333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','skill_alert','Skill Gap Warning','You are missing technical skills required for your saved jobs.','/skill-gaps',false,'2024-05-14T09:15:00Z'),
('n4444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111','deadline','Deadline Approaching','Trendyol application closes in 48 hours.','/postings/p2222222-2222-2222-2222-222222222222',false,'2024-05-13T16:00:00Z')
on conflict (notification_id) do nothing;

insert into public.conversations (conversation_id, application_id, created_at) values
('v1111111-1111-1111-1111-111111111111','a1111111-1111-1111-1111-111111111111','2024-05-10T16:00:00Z'),
('v2222222-2222-2222-2222-222222222222','a3333333-3333-3333-3333-333333333333','2024-05-11T12:00:00Z')
on conflict (conversation_id) do nothing;

insert into public.messages (message_id, conversation_id, sender_person_id, content, sent_at, read_at) values
('m1111111-1111-1111-1111-111111111111','v1111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333','Hi İpek, thanks for applying. Could you share your availability?','2024-05-10T16:05:00Z','2024-05-10T16:10:00Z'),
('m2222222-2222-2222-2222-222222222222','v1111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111','Thank you! I am available weekdays after 14:00.','2024-05-10T16:12:00Z','2024-05-10T16:13:00Z'),
('m3333333-3333-3333-3333-333333333333','v2222222-2222-2222-2222-222222222222','44444444-4444-4444-4444-444444444444','Hi Beyza, can you complete the SQL assessment this week?','2024-05-11T12:05:00Z',null)
on conflict (message_id) do nothing;

insert into public.internship_evaluations (evaluation_id, application_id, evaluator_type, mentorship_q, task_relevance, tech_skill_q, comm_skill_q, professionalism_q, overall_score, comments, submitted_at, is_anonymous) values
('e1111111-1111-1111-1111-111111111111','a1111111-1111-1111-1111-111111111111','student',5,4,null,null,null,4.5,'Great mentorship and clear product tasks.','2024-08-30T00:00:00Z',false),
('e2222222-2222-2222-2222-222222222222','a1111111-1111-1111-1111-111111111111','company',null,null,4,5,5,4.7,'Strong ownership and communication.','2024-08-31T00:00:00Z',false)
on conflict (evaluation_id) do nothing;

insert into public.student_documents (document_id, student_id, doc_type, file_name, file_path, mime_type, file_size_bytes, uploaded_at, parsed_text) values
('d1111111-1111-1111-1111-111111111111','aaaa1111-1111-1111-1111-111111111111','cv','ipek_cv.pdf','/cvs/ipek.pdf','application/pdf',245761,'2024-04-20T00:00:00Z',null),
('d2222222-2222-2222-2222-222222222222','aaaa2222-2222-2222-2222-222222222222','cv','beyza_cv.pdf','/cvs/beyza.pdf','application/pdf',221438,'2024-04-20T00:00:00Z',null)
on conflict (document_id) do nothing;
