import { useEffect, useState, useRef } from "react";
import {Name, Description} from "controls/Tables/components/tableComponents";
import ArgonTypography from "components/ArgonTypography";
import ArgonBadge from "components/ArgonBadge";
import useAccountService from "services/account";
import { formatDateTime } from "utils/dateUtils";

function useAccountsTableData(fetchData) {
  const [data, setData] = useState({ columns: [], rows: [] });
  const [open, setOpen] = useState(false);
  const hasLoaded = useRef(false);
  const { getAccountByUser } = useAccountService();

  const handleSave = () => {
    // Perform save operation here
    console.log('Save button clicked');
  };

  const handleOpen = () => {
      setOpen(true);
  };

  useEffect(() => {
    if (fetchData && !hasLoaded.current) {
      async function fetchData() {
        const account = await getAccountByUser();
        const accounts = [account];
        setData({
          columns: [
            { name: "name", align: "left" },
            { name: "description", align: "left" },
            { name: "type", align: "center" },
            { name: "modified", align: "center" },
            { name: "action", align: "center" },
          ],
          rows: accounts.map(account => ({
            name: <Name name={account.name} />,
            description: <Description description={account.description} />,
            type: (
              <ArgonBadge variant="gradient" badgeContent={account.type} color="success" size="xs" container />
            ),
            modified: (
              <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
                {formatDateTime(account.lastModified)}
              </ArgonTypography>
            ),
            action: (
              <ArgonTypography
                component="a"
                href="#"
                variant="caption"
                color="secondary"
                fontWeight="medium"
                onClick={handleOpen}
              >
                Edit
              </ArgonTypography>
            ),
          })),
        });
        hasLoaded.current = true;
      }
      fetchData();
    }
  }, [fetchData]);

  return { data, open, handleOpen, handleSave, setOpen };
}

export default useAccountsTableData;
