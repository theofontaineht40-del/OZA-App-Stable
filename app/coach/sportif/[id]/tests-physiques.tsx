import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { AccessDenied } from "../../../../components/access-denied";
import { TestLibraryScreen } from "../../../../components/test-library-screen";
import { PHYSICAL_TESTS } from "../../../../constants/physical-tests";
import { usePrincipalAccess } from "../../../../hooks/use-principal-access";

export default function TestsPhysiquesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isPrincipal = usePrincipalAccess(id);

  if (!id || isPrincipal === null) return <View style={{ flex: 1 }} />;

  if (!isPrincipal) {
    return <AccessDenied message="Les tests physiques ne sont visibles que par le coach principal." />;
  }

  return (
    <TestLibraryScreen
      title="Tests physiques"
      category="physical"
      tests={PHYSICAL_TESTS}
      sportifId={id}
    />
  );
}
