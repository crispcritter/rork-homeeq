import React from "react";
import TabStackLayout from "@/components/TabStackLayout";
import { useHome } from "@/contexts/HomeContext";

export default function HomeLayout() {
  const { homeProfile } = useHome();
  const title = homeProfile.nickname || 'My Home';

  return <TabStackLayout title={title} />;
}
