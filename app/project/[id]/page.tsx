import { notFound } from "next/navigation";

async function getProject(id: string) {
  const res = await fetch("http://localhost:3000/api/projects");
  const projects = await res.json();

  return projects.find((p: any) => p.id === id);
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await getProject(id);

  if (!project) return notFound();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        {project.icon} {project.title}
      </h1>

      <p className="text-muted-foreground mt-2">
        Project ID: {project.id}
      </p>
    </div>
  );
}