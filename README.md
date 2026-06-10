# PolicyChecker 🛡️

**PolicyChecker** is an enterprise-grade decision engine and workflow automation platform designed to evaluate business requests (e.g., SaaS purchases, vendor onboarding) against organizational rules. It ensures compliance, assesses risks, and tracks approvals with a comprehensive, immutable audit trail.

## 🚀 Key Features

* **Dynamic Rule Engine:** Build, version, and test complex business policies using a visual Rule Builder (JSON-based conditions and effects).
* **Automated Decision Making:** Automatically approve, reject, or require manual review based on conditions like budget, vendor risk, and GDPR data processing (DPA requirements).
* **Role-Based Access Control (RBAC):** Distinct roles including Requester, Reviewer, Policy Owner, Policy Approver, Auditor, and Admin.
* **Comprehensive Audit Trail:** Immutable logs for all system events, manual overrides, and policy evaluations ensuring full compliance.
* **Modern Tech Stack:** Built with Next.js, Prisma, PostgreSQL, and TailwindCSS for a seamless and responsive user experience.
* **Currency Conversion:** Built-in support for multiple currencies, dynamically converting costs (e.g., PLN, USD to EUR) for uniform policy evaluation.

## 🛠️ Technology Stack

* **Frontend:** Next.js (App Router), React, TailwindCSS
* **Backend:** Node.js, Next.js Server Actions
* **Database:** PostgreSQL with Prisma ORM
* **Testing:** Vitest for unit tests, Playwright for E2E tests and automated screenshot generation.

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd PolicyChecker/web
   ```

2. **Setup environment variables:**
   Create a `.env` file in the `web` directory and configure your PostgreSQL database connection:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/policychecker"
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Initialize database:**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## 📸 Gallery

Below is a visual overview of the system's capabilities:

### Core Dashboards & Authentication
| Login | Requester Dashboard | Reviewer Dashboard | Admin Dashboard |
|:---:|:---:|:---:|:---:|
| ![Login](screenshots/01-login.png) | ![Requester Dashboard](screenshots/11-dashboard-requester.png) | ![Reviewer Dashboard](screenshots/02-dashboard-reviewer.png) | ![Admin Dashboard](screenshots/12-dashboard-admin.png) |

### Request Management & Workflow
| New Request Form | Requests List | Request Details | In-Review Policy Panel |
|:---:|:---:|:---:|:---:|
| ![New Request Form](screenshots/05-request-new-form.png) | ![Requests List](screenshots/03-requests-list-reviewer.png) | ![Request Details](screenshots/04-request-detail.png) | ![In-Review Policy Panel](screenshots/16-request-in-review-policy-panel.png) |

### Advanced Workflows
| Needs Information Banner | Auto-Approved Request | Rejected Request | Manual Override Modal |
|:---:|:---:|:---:|:---:|
| ![Needs Info Banner](screenshots/18-request-needs-information-banner.png) | ![Auto-Approved Request](screenshots/22-request-auto-approved.png) | ![Rejected Request](screenshots/23-request-rejected.png) | ![Manual Override](screenshots/17-request-manual-override-modal.png) |

### Policy Engine & Rule Builder
| Policies List | New Policy Form | Rule Builder | Test Console |
|:---:|:---:|:---:|:---:|
| ![Policies List](screenshots/06-policies-list.png) | ![New Policy Form](screenshots/32-policies-new-form.png) | ![Rule Builder](screenshots/27-policy-add-rule-form.png) | ![Test Console](screenshots/08-policy-test-console.png) |

### Administration & Auditing
| Admin: Users | Audit Trail | Audit: Evaluations | Audit per Request |
|:---:|:---:|:---:|:---:|
| ![Admin: Users](screenshots/10-admin-users.png) | ![Audit Trail](screenshots/09-audit-trail.png) | ![Audit: Evaluations](screenshots/30-audit-evaluations-tab.png) | ![Request Audit Section](screenshots/25-request-audit-trail-section.png) |

---
*Generated screenshots using Playwright test scripts to demonstrate full app functionality.*
