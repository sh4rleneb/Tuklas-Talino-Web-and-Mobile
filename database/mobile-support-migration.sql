-- Additive database support for the production mobile workspace.
-- Run once on databases created from the legacy database/schema.sql baseline.

ALTER TABLE users
  ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE AFTER status;

ALTER TABLE lesson_activities
  MODIFY COLUMN type VARCHAR(40) NOT NULL,
  ADD COLUMN instructions TEXT NULL AFTER title,
  ADD COLUMN data_json JSON NULL AFTER instructions;

ALTER TABLE group_members
  ADD COLUMN group_role VARCHAR(20) NOT NULL DEFAULT 'member' AFTER student_id;

ALTER TABLE group_task_completions
  ADD COLUMN submitted_by_student_id INT NULL AFTER student_id,
  ADD COLUMN verification_status ENUM('pending','approved','returned') NOT NULL DEFAULT 'approved' AFTER submitted_by_student_id,
  ADD COLUMN submitted_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER verification_status,
  ADD COLUMN reviewed_at DATETIME NULL AFTER submitted_at,
  ADD COLUMN reviewed_by_teacher_id INT NULL AFTER reviewed_at,
  ADD COLUMN teacher_feedback TEXT NULL AFTER reviewed_by_teacher_id,
  ADD COLUMN student_role VARCHAR(80) NULL AFTER teacher_feedback,
  ADD COLUMN file_name VARCHAR(255) NULL AFTER student_role,
  ADD COLUMN file_path VARCHAR(255) NULL AFTER file_name,
  ADD COLUMN file_mime_type VARCHAR(120) NULL AFTER file_path,
  ADD COLUMN file_size INT NULL AFTER file_mime_type,
  ADD COLUMN xp_awarded INT NOT NULL DEFAULT 0 AFTER file_size;

CREATE TABLE teacher_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  grade_level INT NOT NULL,
  section VARCHAR(80) NOT NULL,
  status ENUM('active','archived') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_teacher_assignment (teacher_id, grade_level, section),
  CONSTRAINT fk_teacher_assignment_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE TABLE lesson_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  lesson_id INT NOT NULL,
  current_step INT NOT NULL DEFAULT 1,
  total_steps INT NOT NULL DEFAULT 1,
  status ENUM('started','in_progress','completed') NOT NULL DEFAULT 'started',
  last_activity_type VARCHAR(40) NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_lesson_progress (student_id, lesson_id),
  CONSTRAINT fk_lesson_progress_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_lesson_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);

CREATE TABLE quiz_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  lesson_id INT NOT NULL,
  quiz_id VARCHAR(120) NOT NULL,
  quiz_title VARCHAR(220) NULL,
  score INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  percent INT NOT NULL DEFAULT 0,
  attempt_no INT NOT NULL DEFAULT 1,
  xp_awarded INT NOT NULL DEFAULT 0,
  xp_possible INT NOT NULL DEFAULT 0,
  mastery_label VARCHAR(80) NULL,
  review_json JSON NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE mission_completions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  mission_id VARCHAR(80) NOT NULL,
  title VARCHAR(160) NOT NULL,
  xp_awarded INT NOT NULL DEFAULT 0,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_mission_completion (student_id, mission_id),
  CONSTRAINT fk_mission_completion_student FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role VARCHAR(40) NOT NULL DEFAULT 'student',
  type VARCHAR(80) NOT NULL,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at DATETIME NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);
