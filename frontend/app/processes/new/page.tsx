"use client";

import Nav from "@/components/Nav";
import ProcessForm from "@/components/ProcessForm";

export default function NewProcessPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-2xl font-bold">New process</h1>
        <div className="mt-6">
          <ProcessForm />
        </div>
      </main>
    </>
  );
}
