# Database

Supabase tables used by this project.

---

## `workers` (V1 + V2)

Filtered worker profiles for display (1,701 total; 1,116 with favorite ≥50%).

| Column                  | Type    | Description                                        |
| ----------------------- | ------- | -------------------------------------------------- |
| `id`                    | UUID    | Primary key                                        |
| `name`                  | VARCHAR | Worker full name                                   |
| `photo`                 | TEXT    | Photo URL                                          |
| `gender`                | VARCHAR | male/female                                        |
| `market`                | VARCHAR | Geographic market (Austin, Dallas, etc.)           |
| `actively_looking`      | BOOLEAN | Whether worker is actively seeking employment      |
| `shift_verified`        | BOOLEAN | Has completed shifts on Reflex                     |
| `market_favorite`       | BOOLEAN | Is a favorite in their market                      |
| `shifts_on_reflex`      | INTEGER | Total shifts completed                             |
| `brands_worked`         | JSONB   | Array of {name, tier} brand experience             |
| `previous_experience`   | JSONB   | Array of {company, duration, roles}                |
| `endorsement_counts`    | JSONB   | Count of endorsements by type                      |
| `shift_experience`      | JSONB   | Shifts by role type                                |
| `retailer_quotes`       | JSONB   | Array of {quote, brand, role}                      |
| `retailer_summary`      | TEXT    | AI-generated summary                               |
| `reflex_activity`       | JSONB   | shiftsByTier, longestRelationship, tierProgression |
| `invited_back_stores`   | INTEGER | Number of stores that invited worker back          |
| `unique_store_count`    | INTEGER | Number of unique stores worked                     |
| `tardy_ratio`           | VARCHAR | Tardy ratio as fraction (e.g., "2/50")             |
| `tardy_percent`         | NUMERIC | Tardy percentage                                   |
| `urgent_cancel_ratio`   | VARCHAR | Urgent cancel ratio as fraction                    |
| `urgent_cancel_percent` | NUMERIC | Urgent cancel percentage                           |
| `current_tier`          | VARCHAR | Worker tier level                                  |
| `experience_level`      | VARCHAR | rising/experienced/seasoned/proven_leader          |
| `about_me`              | TEXT    | Worker bio                                         |
| `interview_transcript`  | JSONB   | Array of {question, answer}                        |
| `worker_uuid`           | UUID    | External reference UUID                            |
| `worker_id`             | INTEGER | External reference ID                              |

---

## `worker_connections` (V2 only)

Tracks retailer interactions with worker profiles.

| Column            | Type        | Description                                   |
| ----------------- | ----------- | --------------------------------------------- |
| `id`              | UUID        | Primary key (auto-generated)                  |
| `worker_id`       | UUID        | Reference to workers.id                       |
| `market`          | VARCHAR     | Market where connection occurred              |
| `chat_id`         | TEXT        | Unique chat thread identifier                 |
| `status`          | VARCHAR     | liked/invited/accepted/not_interested/removed |
| `invited`         | BOOLEAN     | Retailer sent connection invite               |
| `connected`       | BOOLEAN     | Worker accepted connection                    |
| `chat_open`       | BOOLEAN     | Chat thread is active                         |
| `shift_booked`    | BOOLEAN     | A shift has been booked                       |
| `shift_scheduled` | BOOLEAN     | A shift is scheduled                          |
| `saved_for_later` | BOOLEAN     | Retailer saved worker for later               |
| `created_at`      | TIMESTAMPTZ | When connection was first created             |
| `updated_at`      | TIMESTAMPTZ | When connection was last updated              |

---

## `markets` (V1 only)

Geographic markets.

| Column       | Type        | Description                  |
| ------------ | ----------- | ---------------------------- |
| `id`         | UUID        | Primary key                  |
| `name`       | VARCHAR     | Market name (Austin, Dallas) |
| `state`      | VARCHAR     | State abbreviation (TX, CA)  |
| `created_at` | TIMESTAMPTZ | When record was created      |
| `updated_at` | TIMESTAMPTZ | When record was last updated |

---

## `roles` (V1 only)

Job role types.

| Column           | Type        | Description                        |
| ---------------- | ----------- | ---------------------------------- |
| `id`             | UUID        | Primary key                        |
| `title`          | VARCHAR     | Role title (Sales Associate, etc.) |
| `category`       | VARCHAR     | Role category                      |
| `description`    | TEXT        | Role description                   |
| `match_keywords` | TEXT[]      | Keywords for fuzzy matching        |
| `created_at`     | TIMESTAMPTZ | When record was created            |
| `updated_at`     | TIMESTAMPTZ | When record was last updated       |

---

## `retailers` (V1 + V2)

Retailer brands.

| Column           | Type        | Description                  |
| ---------------- | ----------- | ---------------------------- |
| `id`             | UUID        | Primary key                  |
| `name`           | VARCHAR     | Retailer name                |
| `classification` | VARCHAR     | Luxury/Specialty/Big Box     |
| `created_at`     | TIMESTAMPTZ | When record was created      |
| `updated_at`     | TIMESTAMPTZ | When record was last updated |

---

## `job_postings` (V1 only)

Scraped job listings from Indeed.

| Column            | Type        | Description                |
| ----------------- | ----------- | -------------------------- |
| `id`              | UUID        | Primary key                |
| `market_name`     | VARCHAR     | Market name                |
| `company`         | VARCHAR     | Company name               |
| `location`        | VARCHAR     | Job location               |
| `title`           | VARCHAR     | Job title                  |
| `employment_type` | VARCHAR     | Full-time/Part-time        |
| `salary`          | VARCHAR     | Salary range               |
| `benefits`        | TEXT        | Benefits description       |
| `market_id`       | UUID        | Reference to markets.id    |
| `retailer_id`     | UUID        | Reference to retailers.id  |
| `role_id`         | UUID        | Reference to roles.id      |
| `scraped_at`      | TIMESTAMPTZ | When job was scraped       |
| `source_url`      | TEXT        | Original job posting URL   |
| `source`          | VARCHAR     | Source site (Indeed, etc.) |

---

## `jobs_published` (V1 only)

Published job postings.

| Column           | Type        | Description                |
| ---------------- | ----------- | -------------------------- |
| `id`             | UUID        | Primary key                |
| `job_id`         | VARCHAR     | External job identifier    |
| `job_title`      | VARCHAR     | Job title                  |
| `job_type`       | VARCHAR     | Part-time/Full-time/Either |
| `store_location` | VARCHAR     | Store location             |
| `job_market`     | VARCHAR     | Market name                |
| `pay_type`       | VARCHAR     | hourly/salary              |
| `pay_range`      | VARCHAR     | Pay range string           |
| `benefits`       | TEXT[]      | Array of benefits          |
| `created_at`     | TIMESTAMPTZ | When job was published     |
| `unpublished_at` | TIMESTAMPTZ | When job was unpublished   |

---

## `jobs_applications` (unused — V1 ready)

Worker applications to jobs. Service functions exist in `supabase.ts` but not yet called by any variant.

| Column       | Type        | Description                         |
| ------------ | ----------- | ----------------------------------- |
| `id`         | UUID        | Primary key                         |
| `worker_id`  | UUID        | Reference to workers.id             |
| `job_id`     | UUID        | Reference to jobs_published.id      |
| `status`     | VARCHAR     | viewed/liked/applied/not_interested |
| `invited`    | BOOLEAN     | Whether worker was invited to apply |
| `created_at` | TIMESTAMPTZ | When application was created        |
| `updated_at` | TIMESTAMPTZ | When application was last updated   |
