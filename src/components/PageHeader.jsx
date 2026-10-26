function PageHeader({ title, description, action }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}

export default PageHeader;