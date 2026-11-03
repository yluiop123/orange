import { listRoles } from "@/api/system/role";
import MultipleSelector, { Option } from "@/components/ext/multiple-selector";
import { useReferenceData } from "@/components/ext/use-reference-data";
import { useMemo } from "react";
import { useIntl } from "react-intl";

export default function RoleSelect({ ...props }) {
  const intl = useIntl();
  const { data } = useReferenceData((signal) =>
    listRoles({ page: 1, size: 100 }, signal).then((result) => result.list),
  );
  const options = useMemo<Option[]>(
    () =>
      data.map((role) => ({
        label: role.name,
        value: role.id,
        disable: role.status === "0",
      })),
    [data],
  );

  return (
    <MultipleSelector
      {...props}
      selectFirstItem={false}
      options={options}
      defaultOptions={options}
      placeholder=""
      emptyIndicator={
        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
          {intl.formatMessage({ id: "table.empty" })}
        </p>
      }
    />
  );
}
