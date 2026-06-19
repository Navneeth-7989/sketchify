-- CreateTable
CREATE TABLE "Drawing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "elements" JSONB NOT NULL DEFAULT '[]',
    "appState" JSONB NOT NULL DEFAULT '{}',
    "files" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Drawing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Drawing_userId_key" ON "Drawing"("userId");

-- AddForeignKey
ALTER TABLE "Drawing" ADD CONSTRAINT "Drawing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
