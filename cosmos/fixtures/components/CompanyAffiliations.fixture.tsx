import { CompanyAffiliations } from "@/components/company-affiliations";

const currentPosition = {
  id: 1,
  startDate: "2023-01-15",
  endDate: null,
  role: "Senior Konsulent",
  company: { id: 1, name: "Kodemaker Systemutvikling AS" },
};

const previousPositions = [
  {
    id: 2,
    startDate: "2020-03-01",
    endDate: "2022-12-31",
    role: "Utvikler",
    company: { id: 2, name: "Tidligere Selskap AS" },
  },
  {
    id: 3,
    startDate: "2018-06-01",
    endDate: "2020-02-28",
    role: null,
    company: { id: 3, name: "Gammelt Firma" },
  },
];

const noop = () => {};

export default {
  currentOnly: (
    <div className="max-w-xl bg-secondary rounded-lg p-5">
      <CompanyAffiliations
        contactId={1}
        history={[currentPosition]}
        onMutate={noop}
      />
    </div>
  ),
  withPreviousPositions: (
    <div className="max-w-xl bg-secondary rounded-lg p-5">
      <CompanyAffiliations
        contactId={1}
        history={[currentPosition, ...previousPositions]}
        onMutate={noop}
      />
    </div>
  ),
  noCurrent: (
    <div className="max-w-xl bg-secondary rounded-lg p-5">
      <CompanyAffiliations
        contactId={1}
        history={previousPositions}
        onMutate={noop}
      />
    </div>
  ),
  empty: (
    <div className="max-w-xl bg-secondary rounded-lg p-5">
      <CompanyAffiliations contactId={1} history={[]} onMutate={noop} />
    </div>
  ),
};
