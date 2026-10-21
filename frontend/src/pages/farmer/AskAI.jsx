import AIChat from "../../components/AIcHAT.JSX";

export default function AskAI() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Ask AI about your animals
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Answers use disease guidelines plus your animals' status and your vet's
        reports.
      </p>
      <AIChat placeholder="e.g. Is AN-1002 safe? Cow has swollen udder, what could it be?" />
    </div>
  );
}
