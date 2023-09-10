-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "identifier" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "startTime" TIMESTAMPTZ NOT NULL,
    "endTime" TIMESTAMPTZ NOT NULL,
    "status" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);
