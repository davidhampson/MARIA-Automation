import { createWebHistory, createRouter } from "vue-router";
import DashboardView from "@/components/DashboardView";
import ParameterView from "@/components/ParameterView";
import CameraView from "@/components/CameraView";

const routes = [
    {
        path: "/",
        name: "Dashboard",
        component: DashboardView,

    },
    {
        path: "/parameters",
        name: "Parameters",
        component: ParameterView,
    },
    {
        path: "/cameras",
        name: "Cameras",
        component: CameraView,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
