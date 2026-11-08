/**
 * Static frontend-owned Swagger page. The schema lives in `public/openapi.json`
 * and is never fetched from a running backend, so the docs stay fixed across
 * environments.
 */
export default function SwaggerPage() {
  return (
    <iframe
      title="Orange API documentation"
      src={`${import.meta.env.BASE_URL}swagger.html`}
      className="h-svh w-full border-0"
    />
  );
}
