import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("mobile visual layout", () => {
  it("keeps all four proposal tabs visible on an iPhone viewport", () => {
    const source = readSource("src/pages/Matches.tsx");

    expect(source).toContain("grid grid-cols-4");
    expect(source).not.toContain('className="flex gap-2 px-6 pb-3 shrink-0 overflow-x-auto no-scrollbar"');
  });

  it("keeps the empty profile card compact above the bottom navigation", () => {
    const source = readSource("src/pages/MeuPerfil.tsx");

    expect(source).toContain('GlassCard className="mb-24 p-5 flex flex-col items-center gap-2.5 text-center"');
    expect(source).toContain('className="h-14 w-14 rounded-2xl bg-primary/10');
  });

  it("fills Explore behind the navbar and hides navigation during overlays", () => {
    const source = readSource("src/pages/Explorar.tsx");

    expect(source).not.toContain(">\n          Explorar\n        </h1>");
    expect(source).toContain("justify-start w-full pt-0 z-10 min-h-0");
    expect(source).not.toContain("justify-start w-full pb-28 pt-0 z-10");
    expect(source).toContain('{!filtersOpen && !showSelectItem && <BottomNav');
    expect(source).not.toContain("NotificationBell");
  });

  it("shows complete Explore images over adaptive full-card media fill", () => {
    const source = readSource("src/components/SwipeCard.tsx");
    const css = readSource("src/index.css");

    expect(source).toContain("swipe-media-stage");
    expect(source).toContain('className="swipe-media-ambient"');
    expect(source).toContain('className="swipe-media-foreground"');
    expect(source).toContain("getMediaAspectClass");
    expect(source).toContain("getMediaObjectPosition");
    expect(source).toContain("objectPosition: getMediaObjectPosition(currentImageRecord)");
    expect(source).toContain("onLoad={handleImageLoad}");
    expect(css).toContain(".swipe-media-stage--wide .swipe-media-foreground");
    expect(css).toContain("object-position: center 34%;");
    expect(css).toContain("transform: scale(1.035);");
    expect(css).toContain(".swipe-media-stage--wide .swipe-media-ambient");
    expect(css).toContain("opacity: 0.9;");
    expect(css).toContain("object-fit: contain;");
    expect(source).not.toContain('className="w-full h-full object-cover object-center"');
  });

  it("keeps media dots below the Dynamic Island while videos stay full-bleed", () => {
    const source = readSource("src/components/SwipeCard.tsx");

    expect(source).toContain('style={{ top: "calc(var(--safe-area-top) + 2.85rem)" }}');
    expect(source).not.toContain("absolute top-0.5 left-1/2");
    expect(source).toContain("w-full h-full object-cover object-center transition-opacity");
  });

  it("places Explore price beside its truncating item title", () => {
    const source = readSource("src/components/SwipeCard.tsx");

    expect(source).toContain("flex min-w-0 items-end gap-3 border-b");
    expect(source).toContain("min-w-0 flex-1 truncate");
    expect(source).toContain("shrink-0 text-white");
  });

  it("uses a Tinder-like downward exit motion for Explore swipes", () => {
    const source = readSource("src/components/SwipeCard.tsx");

    expect(source).toContain("const EXIT_Y = 260;");
    expect(source).toContain("animate(y, EXIT_Y");
    expect(source).toContain("animate(y, 0");
    expect(source).toContain("y: standby ? 0 : y");
    expect(source).toContain("const standbyOpacity = useTransform(revealProgress, [0, 1], [0, 1]);");
    expect(source).toContain("const standbyScale = useTransform(revealProgress, [0, 1], [0.97, 1]);");
    expect(source).toContain("standby ? { opacity: standbyOpacity } : {}");
  });

  it("reveals the next Explore card only while the active card is moving", () => {
    const source = readSource("src/pages/Explorar.tsx");

    expect(source).toContain("const dragDirectionValue = useMotionValue(0);");
    expect(source).toContain("dragDirectionValue.set(rawX);");
    expect(source).toContain("revealMotionX={dragDirectionValue}");
  });

  it("hides the bottom navigation while configuring the search", () => {
    const source = readSource("src/pages/Explorar.tsx");

    expect(source).toContain('{!filtersOpen && !showSelectItem && <BottomNav activeTab="explorar" />}');
    expect(source).toContain("<SheetTitle>Configurar busca</SheetTitle>");
  });

  it("shares Explore items through the native share helper with a public URL", () => {
    const source = readSource("src/components/SwipeCard.tsx");
    const packageSource = readSource("package.json");

    expect(source).toContain("shareContent({");
    expect(source).toContain("buildPublicItemUrl(item.id)");
    expect(packageSource).toContain('"@capacitor/share"');
  });

  it("uses lighter compact glass at both Explore edges", () => {
    const card = readSource("src/components/SwipeCard.tsx");
    const source = readSource("src/index.css");

    expect(card).toContain("swipe-edge-glass-bottom-compact");
    expect(source).toContain("--swipe-foreground-top-fade");
    expect(source).toContain("rgba(0, 0, 0, 0.68) 22%");
    expect(source).toContain("black 31%");
    expect(source).toContain("mask-image: var(--swipe-foreground-top-fade);");
    expect(source).toContain("-webkit-mask-image: var(--swipe-foreground-top-fade);");
    expect(source).toContain("height: min(26%, 238px);");
    expect(source).toContain("backdrop-filter: blur(10px) saturate(110%);");
    expect(source).toContain("rgba(9, 14, 22, 0.26)");
    expect(source).toContain("rgba(0, 0, 0, 0.76) 38%");
  });

  it("uses lighter Explore actions and a tuned floating glass navbar", () => {
    const actions = readSource("src/components/SwipeCard/SwipeActionButtons.tsx");
    const nav = readSource("src/components/BottomNav.tsx");
    const css = readSource("src/index.css");

    expect(actions).toContain('className="mt-5 flex items-center justify-center gap-7 pointer-events-auto"');
    expect(actions).toContain("h-14 w-14");
    expect(actions).toContain("h-6 w-6");
    expect(nav).toContain("hypou-bottom-nav");
    expect(css).toContain(".hypou-bottom-nav");
    expect(css).toContain("backdrop-filter: blur(26px) saturate(118%);");
  });

  it("keeps the proposal drawer above the native keyboard", () => {
    const dialog = readSource("src/components/SelectItemDialog.tsx");
    const css = readSource("src/index.css");
    const html = readSource("index.html");

    expect(dialog).toContain("proposal-drawer");
    expect(dialog).toContain("shouldScaleBackground={false}");
    expect(dialog).toContain("overflow-y-auto");
    expect(dialog).toContain("cashInputRef");
    expect(dialog).not.toContain("scrollIntoView");
    expect(dialog).not.toContain("window.setTimeout");
    expect(dialog).toContain("text-[16px]");
    expect(dialog).toContain("proposal-item-list");
    expect(dialog).toContain("proposal-range-warning");
    expect(dialog).toContain("proposal-cash-note");
    expect(html).toContain("maximum-scale=1");
    expect(html).toContain("user-scalable=no");
    expect(css).toContain("body.keyboard-visible .proposal-drawer");
    expect(css).toContain("body.keyboard-visible .proposal-item-list");
    expect(css).toContain("bottom: var(--keyboard-height, 0px);");
    expect(css).toContain("100dvh - var(--keyboard-height, 0px) - var(--safe-area-top)");
    expect(css).toContain("-webkit-text-size-adjust: 100%;");
    expect(css).toContain("input,");
    expect(css).toContain("font-size: 16px;");
    expect(css).toContain("scroll-padding-bottom: calc(var(--keyboard-height, 0px) + var(--safe-area-bottom));");
  });

  it("keeps item forms keyboard-safe and exposes photo source choices", () => {
    const novo = readSource("src/pages/NovoItem.tsx");
    const editar = readSource("src/pages/EditarItem.tsx");
    const css = readSource("src/index.css");

    for (const source of [novo, editar]) {
      expect(source).toContain("<SheetTitle className=\"text-foreground text-center\">Adicionar foto</SheetTitle>");
      expect(source).toContain("Tirar foto");
      expect(source).toContain("Escolher da galeria");
      expect(source).toContain("item-form-scroll");
      expect(source).toContain("item-form-submit");
      expect(source).not.toContain("isNativePlatform() ? handleItemPhotos()");
      expect(source).not.toContain("isNativePlatform() ? handleNewPhotos()");
    }

    expect(css).toContain("body.keyboard-visible .item-form-scroll");
    expect(css).toContain("body.keyboard-visible .item-form-submit");
    expect(css).toContain("var(--keyboard-height, 0px)");
  });

  it("shows video attachment as a first-class chat action", () => {
    const input = readSource("src/pages/Conversa/MessageInput.tsx");

    expect(input).toContain("Anexar mídia");
    expect(input).toContain("handleVideoPick");
    expect(input).toContain('onFileSelect(file, "video")');
    expect(input).toContain("<span className=\"text-xs text-foreground/70 font-semibold\">Vídeo</span>");
  });

  it("keeps bottom navigation below modals and absent during proposals", () => {
    const nav = readSource("src/components/BottomNav.tsx");
    const explore = readSource("src/pages/Explorar.tsx");
    const profile = readSource("src/pages/MeuPerfil.tsx");
    const css = readSource("src/index.css");

    expect(nav).toContain("zIndex: 40");
    expect(nav).toContain("shouldHideBottomNav");
    expect(nav).toContain("hypou-bottom-nav-wrapper");
    expect(css).toContain('body[data-bottom-nav-hidden="true"] .hypou-bottom-nav-wrapper');
    expect(explore).toContain("{!filtersOpen && !showSelectItem && <BottomNav");
    expect(profile).toContain('{!proposalTarget && <BottomNav activeTab="perfil" />}');
  });

  it("blocks pull refresh in overlays and item forms", () => {
    for (const overlay of ["dialog", "drawer", "sheet"]) {
      expect(readSource(`src/components/ui/${overlay}.tsx`)).toContain('data-pull-refresh-disabled="true"');
    }

    expect(readSource("src/pages/NovoItem.tsx")).toContain("<ScreenLayout refreshable={false}>");
    expect(readSource("src/pages/EditarItem.tsx")).toContain("<ScreenLayout refreshable={false}>");
    expect(readSource("src/pages/Perfil.tsx")).not.toContain("ScreenLayout");
    expect(readSource("src/pages/Chamada.tsx")).not.toContain("ScreenLayout");
  });

  it("uses only the global pull-to-refresh controller in Chat", () => {
    const source = readSource("src/pages/Chat.tsx");

    expect(source).not.toContain('import PullToRefresh from "@/components/PullToRefresh"');
    expect(source).toContain("<ScreenLayout onRefresh={handleRefresh}>");
    expect(source).toContain('className="relative flex-1 w-full z-10 pb-28 overflow-y-auto no-scrollbar"');
  });

  it("preserves the current Explore card during pull refresh", () => {
    const source = readSource("src/pages/Explorar.tsx");

    expect(source).toContain("const refreshItemIdRef = useRef<string | null>(null)");
    expect(source).toContain("findRefreshIndex");
    expect(source).toContain("<ScreenLayout edgeToEdgeTop onRefresh={handleRefresh}>");
    expect(source).toContain('queryClient.refetchQueries({ queryKey: ["explore-items", user?.id], exact: true })');
  });
});
