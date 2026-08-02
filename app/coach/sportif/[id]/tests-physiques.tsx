import { useLocalSearchParams } from "expo-router";

import { TestLibraryScreen } from "../../../../components/test-library-screen";
import { PHYSICAL_TESTS } from "../../../../constants/physical-tests";

export default function TestsPhysiquesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) return null;

  return (
    <TestLibraryScreen
      title="Tests physiques"
      category="physical"
      tests={PHYSICAL_TESTS}
      sportifId={id}
    />
  );
}
