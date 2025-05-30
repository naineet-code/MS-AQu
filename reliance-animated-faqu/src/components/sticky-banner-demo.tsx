import { StickyBanner } from "@/components/ui/sticky-banner";

export default function StickyBannerDemo() {
  return (
    <div className="relative flex h-[60vh] w-full flex-col overflow-y-auto">
      <StickyBanner className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <p className="mx-0 max-w-[90%] text-white drop-shadow-md text-sm font-medium">
          🚧 Development Preview: This FAQ system is in early development. Features and responses may change as we improve the platform.{" "}
          <a href="#" className="underline transition duration-200 hover:text-blue-200">
            Learn more
          </a>
        </p>
      </StickyBanner>
      <DummyContent />
    </div>
  );
}

const DummyContent = () => {
  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 py-8">
      <div className="h-96 w-full animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
      <div className="h-96 w-full animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
      <div className="h-96 w-full animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
    </div>
  );
}; 