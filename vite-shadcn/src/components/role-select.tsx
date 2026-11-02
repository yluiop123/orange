import { listRoles } from "@/api/system/role";
import MultipleSelector, { Option } from "@/components/ext/multiple-selector";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";

export default function RoleSelect({ ...props }) {
  const intl = useIntl();
  const [options, setOptions] = useState<Option[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    listRoles({ page: 1, size: 100 }, controller.signal)
      .then((result) => {
        setOptions(
          result.list.map((role) => ({
            label: role.name,
            value: role.id,
          })),
        );
      })
      .catch(() => {
        // 错误提示由 axios 拦截器统一处理
      });
    return () => controller.abort();
  }, []);

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
