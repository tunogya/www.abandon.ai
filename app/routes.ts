import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("api", "routes/api.tsx"),
    route("vaccine", "routes/vaccine.tsx")
] satisfies RouteConfig;
