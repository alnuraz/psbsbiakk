CREATE TABLE "medical_records" (
	"workspace" text,
	"collection" text,
	"id" text,
	"data" jsonb NOT NULL,
	CONSTRAINT "medical_records_pkey" PRIMARY KEY("workspace","collection","id")
);
