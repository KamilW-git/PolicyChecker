-- CreateEnum
CREATE TYPE "Role" AS ENUM ('REQUESTER', 'REVIEWER', 'POLICY_OWNER', 'POLICY_APPROVER', 'ADMIN', 'AUDITOR');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('NEW_VENDOR', 'NEW_SOFTWARE', 'SOFTWARE_RENEWAL', 'CONSULTING_SERVICE', 'HARDWARE_PURCHASE', 'EXCEPTION_REQUEST');

-- CreateEnum
CREATE TYPE "RequestCategory" AS ENUM ('SAAS', 'HARDWARE', 'CONSULTING', 'MARKETING_SERVICE', 'CLOUD_SERVICE', 'DATA_PROVIDER', 'OTHER');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'AUTO_APPROVED', 'NEEDS_INFORMATION', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'APPROVED_WITH_EXCEPTION', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Decision" AS ENUM ('APPROVED', 'REQUIRES_REVIEW', 'REJECTED', 'MISSING_INFORMATION');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'PLN', 'GBP');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('IT', 'HR', 'FINANCE', 'MARKETING', 'SALES', 'LEGAL', 'PROCUREMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "VendorRisk" AS ENUM ('UNKNOWN', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('DPA', 'CONTRACT', 'OFFER', 'APPROVAL_MAIL', 'SECURITY_QUESTIONNAIRE', 'VENDOR_ASSESSMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "PolicyDomain" AS ENUM ('PROCUREMENT', 'VENDOR_RISK', 'DATA_SECURITY', 'FINANCE');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RuleSeverity" AS ENUM ('INFO', 'WARNING', 'BLOCKER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT 'password123',
    "role" "Role" NOT NULL DEFAULT 'REQUESTER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "RequestType" NOT NULL,
    "category" "RequestCategory" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'DRAFT',
    "decision" "Decision",
    "annualCost" DOUBLE PRECISION,
    "currency" "Currency",
    "vendorName" TEXT NOT NULL,
    "vendorCountry" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "processesPersonalData" BOOLEAN NOT NULL DEFAULT false,
    "hasDpa" BOOLEAN NOT NULL DEFAULT false,
    "transferOutsideEEA" BOOLEAN NOT NULL DEFAULT false,
    "securityQuestionnaire" BOOLEAN NOT NULL DEFAULT false,
    "dataCategories" JSONB,
    "urgency" "Urgency" NOT NULL DEFAULT 'NORMAL',
    "vendorRisk" "VendorRisk" NOT NULL DEFAULT 'LOW',
    "inputData" JSONB NOT NULL,
    "requesterId" TEXT NOT NULL,
    "businessOwnerId" TEXT NOT NULL,
    "budgetOwnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestComment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestAttachment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT,
    "type" "AttachmentType" NOT NULL DEFAULT 'OTHER',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "domain" "PolicyDomain" NOT NULL,
    "status" "PolicyStatus" NOT NULL DEFAULT 'DRAFT',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyVersion" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "PolicyStatus" NOT NULL DEFAULT 'DRAFT',
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "policyVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "severity" "RuleSeverity" NOT NULL,
    "condition" JSONB NOT NULL,
    "effect" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyEvaluation" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "decision" "Decision" NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "resultSnapshot" JSONB NOT NULL,
    "appliedPolicyVersions" JSONB NOT NULL,
    "evaluatedById" TEXT,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyEvaluationRuleMatch" (
    "id" TEXT NOT NULL,
    "policyEvaluationId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "policyVersionId" TEXT NOT NULL,
    "effectTriggered" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyEvaluationRuleMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualOverride" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "originalDecision" "Decision",
    "overrideDecision" "Decision" NOT NULL,
    "overrideStatus" "RequestStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "attachmentPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_budgetOwnerId_fkey" FOREIGN KEY ("budgetOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestComment" ADD CONSTRAINT "RequestComment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestComment" ADD CONSTRAINT "RequestComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestAttachment" ADD CONSTRAINT "RequestAttachment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyVersion" ADD CONSTRAINT "PolicyVersion_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "PolicyVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyEvaluation" ADD CONSTRAINT "PolicyEvaluation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyEvaluation" ADD CONSTRAINT "PolicyEvaluation_evaluatedById_fkey" FOREIGN KEY ("evaluatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyEvaluationRuleMatch" ADD CONSTRAINT "PolicyEvaluationRuleMatch_policyEvaluationId_fkey" FOREIGN KEY ("policyEvaluationId") REFERENCES "PolicyEvaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyEvaluationRuleMatch" ADD CONSTRAINT "PolicyEvaluationRuleMatch_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyEvaluationRuleMatch" ADD CONSTRAINT "PolicyEvaluationRuleMatch_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "PolicyVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualOverride" ADD CONSTRAINT "ManualOverride_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualOverride" ADD CONSTRAINT "ManualOverride_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

