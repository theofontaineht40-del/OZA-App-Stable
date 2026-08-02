import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { AccessDenied } from "../../../../components/access-denied";
import { TestLibraryScreen } from "../../../../components/test-library-screen";
import { MOBILITY_TESTS } from "../../../../constants/mobility-tests";
import { usePrincipalAccess } from "../../../../hooks/use-principal-access";

export default function MobiliteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isPrincipal = usePrincipalAccess(id);

  if (!id || isPrincipal === null) return <View style={{ flex: 1 }} />;

  if (!isPrincipal) {
    return <AccessDenied message="Les tests de mobilité ne sont visibles que par le coach principal." />;
  }

  return (
    <TestLibraryScreen
      title="Tests de mobilité"
      category="mobility"
      tests={MOBILITY_TESTS}
      sportifId={id}
    />
  );
}
