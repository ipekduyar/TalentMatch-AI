insert into persons (person_id, auth_user_id, first_name, last_name, email, role, kvkk_consent, kvkk_consent_at, avatar_url) values
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'İpek', 'Duyar', 'ipek@example.com', 'student', true, now(), 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ipek'),
('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Beyza', 'Dönmez', 'beyza@example.com', 'student', true, now(), 'https://api.dicebear.com/7.x/avataaars/svg?seed=Beyza'),
('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Emir', 'Yılmaz', 'emir@example.com', 'student', true, now(), null),
('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Ahmet', 'Kaya', 'ahmet@garantibbva.com', 'company_rep', true, now(), null),
('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'Zeynep', 'Şahin', 'zeynep@trendyol.com', 'company_rep', true, now(), null),
('66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'Mert', 'Demir', 'mert@getir.com', 'company_rep', true, now(), null),
('77777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'Elif', 'Aydın', 'elif@turktelekom.com.tr', 'company_rep', true, now(), null),
('88888888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'Can', 'Çelik', 'can@arcelik.com', 'company_rep', true, now(), null),
('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9', 'Admin', 'User', 'admin@talentmatch.ai', 'admin', true, now(), null)
on conflict do nothing;

insert into students (student_id, person_id, university, department, student_number, gpa, academic_year, graduation_date, career_goal, is_edu_verified, profile_complete) values
('aaaaaaaa-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'ITU', 'Industrial Engineering', '123456789', 3.45, 4, '2026-06-30', 'Product Management', true, true),
('aaaaaaaa-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'ITU', 'Computer Engineering', '987654321', 3.21, 4, '2026-06-30', 'Data Science', true, true),
('aaaaaaaa-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Bogazici University', 'Software Engineering', '555444333', 3.62, 3, '2027-06-30', 'Backend Engineering', true, true)
on conflict do nothing;

insert into companies (company_id, name, industry, size, website, location, description, is_premium, is_approved, avg_evaluation_score) values
('bbbbbbbb-1111-1111-1111-111111111111','Garanti BBVA','Finance','enterprise','https://www.garantibbva.com.tr','Istanbul','Leading bank in Turkey.',true,true,4.30),
('bbbbbbbb-2222-2222-2222-222222222222','Trendyol','Technology','enterprise','https://www.trendyol.com','Istanbul','Major e-commerce platform.',true,true,4.10),
('bbbbbbbb-3333-3333-3333-333333333333','Getir','Technology','enterprise','https://getir.com','Istanbul','Quick commerce pioneer.',true,true,4.00),
('bbbbbbbb-4444-4444-4444-444444444444','Türk Telekom','Telecommunications','enterprise','https://www.turktelekom.com.tr','Ankara','Telecom and digital infrastructure company.',true,true,4.20),
('bbbbbbbb-5555-5555-5555-555555555555','Arçelik','Manufacturing','enterprise','https://www.arcelikglobal.com','Istanbul','Consumer durable goods company.',true,true,4.00)
on conflict do nothing;

insert into company_representatives (rep_id, person_id, company_id, job_title, is_verified) values
('cccccccc-1111-1111-1111-111111111111','44444444-4444-4444-4444-444444444444','bbbbbbbb-1111-1111-1111-111111111111','HR Manager',true),
('cccccccc-2222-2222-2222-222222222222','55555555-5555-5555-5555-555555555555','bbbbbbbb-2222-2222-2222-222222222222','Talent Acquisition Specialist',true),
('cccccccc-3333-3333-3333-333333333333','66666666-6666-6666-6666-666666666666','bbbbbbbb-3333-3333-3333-333333333333','People Partner',true),
('cccccccc-4444-4444-4444-444444444444','77777777-7777-7777-7777-777777777777','bbbbbbbb-4444-4444-4444-444444444444','Recruiter',true),
('cccccccc-5555-5555-5555-555555555555','88888888-8888-8888-8888-888888888888','bbbbbbbb-5555-5555-5555-555555555555','University Relations Lead',true)
on conflict do nothing;

insert into skills (skill_id, name, category) values
('dddddddd-0001-0001-0001-000000000001','Python','technical'),('dddddddd-0002-0002-0002-000000000002','JavaScript','technical'),('dddddddd-0003-0003-0003-0003-000000000003','TypeScript','technical'),('dddddddd-0004-0004-0004-0004-000000000004','SQL','technical'),('dddddddd-0005-0005-0005-0005-000000000005','React','technical'),('dddddddd-0006-0006-0006-0006-000000000006','Node.js','technical'),('dddddddd-0007-0007-0007-0007-000000000007','Pandas','technical'),('dddddddd-0008-0008-0008-0008-000000000008','Agile','domain'),('dddddddd-0009-0009-0009-0009-000000000009','Product Management','domain'),('dddddddd-0010-0010-0010-0010-000000000010','Communication','soft')
on conflict do nothing;

insert into student_skills (student_skill_id, student_id, skill_id, proficiency, verified) values
('eeeeeeee-1111-1111-1111-111111111111','aaaaaaaa-1111-1111-1111-111111111111','dddddddd-0009-0009-0009-0009-000000000009',4,true),
('eeeeeeee-1111-1111-1111-222222222222','aaaaaaaa-1111-1111-1111-111111111111','dddddddd-0008-0008-0008-0008-000000000008',4,true),
('eeeeeeee-2222-2222-2222-111111111111','aaaaaaaa-2222-2222-2222-222222222222','dddddddd-0001-0001-0001-0001-000000000001',4,true),
('eeeeeeee-2222-2222-2222-222222222222','aaaaaaaa-2222-2222-2222-222222222222','dddddddd-0004-0004-0004-0004-000000000004',3,true)
on conflict do nothing;

-- postings/applications/conversations/messages/notifications/resources/reports/evaluations abbreviated for brevity but complete coverage
insert into internship_postings (posting_id, company_id, rep_id, title, description, location, industry, start_date, duration_weeks, is_paid, monthly_stipend_try, is_remote, status, deadline) values
('f1111111-1111-1111-1111-111111111111','bbbbbbbb-1111-1111-1111-111111111111','cccccccc-1111-1111-1111-111111111111','Product Management Intern','Digital banking team focused on UX and lifecycle.','Istanbul','Finance','2026-07-01',12,true,30000,false,'active','2026-06-20'),
('f2222222-2222-2222-2222-222222222222','bbbbbbbb-2222-2222-2222-222222222222','cccccccc-2222-2222-2222-222222222222','Data Science Intern','Build predictive models for marketplace demand.','Istanbul','Technology','2026-07-15',16,true,32000,true,'active','2026-06-25')
on conflict do nothing;
insert into posting_skills (posting_skill_id, posting_id, skill_id, is_required, importance_score, required_level) values
('f3333333-1111-1111-1111-111111111111','f1111111-1111-1111-1111-111111111111','dddddddd-0009-0009-0009-0009-000000000009',true,5,4),
('f3333333-2222-2222-2222-222222222222','f2222222-2222-2222-2222-222222222222','dddddddd-0001-0001-0001-0001-000000000001',true,5,4)
on conflict do nothing;

insert into applications (application_id, student_id, posting_id, match_score, status, cover_note) values
('a1111111-1111-1111-1111-111111111111','aaaaaaaa-1111-1111-1111-111111111111','f1111111-1111-1111-1111-111111111111',85,'shortlisted','I am very interested in product strategy.'),
('a2222222-2222-2222-2222-222222222222','aaaaaaaa-2222-2222-2222-222222222222','f2222222-2222-2222-2222-222222222222',78,'pending','I want to contribute to data-driven growth.')
on conflict do nothing;

insert into skill_gap_reports (report_id, student_id, posting_id, summary_text, percentile_rank) values
('g1111111-1111-1111-1111-111111111111','aaaaaaaa-1111-1111-1111-111111111111','f1111111-1111-1111-1111-111111111111','Strong PM fundamentals; SQL depth needed.',72),
('g2222222-2222-2222-2222-222222222222','aaaaaaaa-2222-2222-2222-222222222222','f2222222-2222-2222-2222-222222222222','Good Python base; communication and experimentation can improve.',68)
on conflict do nothing;

insert into skill_gap_details (gap_detail_id, report_id, skill_id, student_level, required_level, gap_score, urgency) values
('h1111111-1111-1111-1111-111111111111','g1111111-1111-1111-1111-111111111111','dddddddd-0004-0004-0004-0004-000000000004',2,4,2,'moderate'),
('h2222222-2222-2222-2222-222222222222','g2222222-2222-2222-2222-222222222222','dddddddd-0010-0010-0010-0010-000000000010',2,4,2,'critical')
on conflict do nothing;

insert into learning_resources (resource_id, skill_id, title, provider, url, duration_hours, cost_type, cost_amount_try, avg_rating, level) values
('i1111111-1111-1111-1111-111111111111','dddddddd-0009-0009-0009-0009-000000000009','Product Lifecycle Fundamentals','Udemy','https://www.udemy.com',15,'paid',500,4.6,'intermediate'),
('i2222222-2222-2222-2222-222222222222','dddddddd-0004-0004-0004-0004-000000000004','SQL for Data Analysis','edX','https://www.edx.org',45,'free',null,4.9,'beginner')
on conflict do nothing;

insert into notifications (notification_id, person_id, type, title, message, link_url, is_read) values
('j1111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111','new_match','High Match Found!','A new internship matches your profile.','/postings/f1111111-1111-1111-1111-111111111111',false),
('j2222222-2222-2222-2222-222222222222','22222222-2222-2222-2222-222222222222','status_update','Application Update','Your application is under review.','/applications',false)
on conflict do nothing;

insert into conversations (conversation_id, application_id) values
('k1111111-1111-1111-1111-111111111111','a1111111-1111-1111-1111-111111111111')
on conflict do nothing;

insert into messages (message_id, conversation_id, sender_person_id, content) values
('l1111111-1111-1111-1111-111111111111','k1111111-1111-1111-1111-111111111111','44444444-4444-4444-4444-444444444444','Merhaba İpek, mülakat detaylarını paylaşacağız.'),
('l2222222-2222-2222-2222-222222222222','k1111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111','Teşekkürler, uygun zaman dilimlerini paylaşabilirim.')
on conflict do nothing;

insert into internship_evaluations (evaluation_id, application_id, evaluator_type, mentorship_q, task_relevance, tech_skill_q, comm_skill_q, professionalism_q, overall_score, comments) values
('m1111111-1111-1111-1111-111111111111','a1111111-1111-1111-1111-111111111111','student',5,4,null,null,null,4.5,'Mentorship was strong and tasks were meaningful.'),
('m2222222-2222-2222-2222-222222222222','a1111111-1111-1111-1111-111111111111','company',null,null,4,5,5,4.7,'Great ownership and communication.')
on conflict do nothing;
