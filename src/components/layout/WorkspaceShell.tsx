import React from "react";
import { getThemeCssVars } from "@/lib/utils/themes";
import { FloatingHearts } from "@/components/animations/FloatingHearts";
import { SidebarNav } from "@/components/layout/SidebarNav";
import type { CoupleWorkspaceContext } from "@/types/domain";

export function WorkspaceShell({
  workspace,
  children,
}: {
  workspace: CoupleWorkspaceContext;
  children: React.ReactNode;
}) {
  const cssVars = getThemeCssVars(
    workspace.settings.theme_preset,
    workspace.settings.font_family
  ) as React.CSSProperties;

  return (
    <div style={cssVars} className="romantic-bg min-h-screen text-brand-dark">
      <FloatingHearts style={workspace.settings.animation_style} />
      <SidebarNav workspace={workspace}>{children}</SidebarNav>
    </div>
  );
}
