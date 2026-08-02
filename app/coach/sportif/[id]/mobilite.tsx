import { useLocalSearchParams } from "expo-router";

import { TestLibraryScreen } from "../../../../components/test-library-screen";
import { MOBILITY_TESTS } from "../../../../constants/mobility-tests";

export default function MobiliteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) return null;

  return (
    <TestLibraryScreen
      title="Tests de mobilité"
      category="mobility"
      tests={MOBILITY_TESTS}
      sportifId={id}
    />
  );
}
