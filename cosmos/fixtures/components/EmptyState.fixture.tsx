import { EmptyState } from "@/components/ui/empty-state";
import {
  Rocket,
  Target,
  TrendingUp,
  ClipboardCheck,
  Calendar,
  ListTodo,
  AtSign,
  MessageCircle,
  PartyPopper,
  Users,
  Building2,
  Briefcase,
} from "lucide-react";

export default {
  "Horizontal - Leads (With Action)": (
    <div className="p-4">
      <EmptyState
        layout="horizontal"
        icons={[Rocket, Target, TrendingUp]}
        title="Ingen leads enda"
        description="Er det noe du kan gjøre for å endre dette?"
        action={{ label: "Legg til lead", onClick: () => console.log("clicked") }}
      />
    </div>
  ),
  "Horizontal - Tasks (No Action)": (
    <div className="p-4">
      <EmptyState
        layout="horizontal"
        icons={[ClipboardCheck, Calendar, ListTodo]}
        title="Ingen oppgaver enda"
        description="Lag oppgaver i feltet over. Her legges oppgaver som må gjøres."
      />
    </div>
  ),
  "Horizontal - Activities (No Action)": (
    <div className="p-4">
      <EmptyState
        layout="horizontal"
        icons={[AtSign, MessageCircle, PartyPopper]}
        title="Ingen hendelser enda"
        description="Her logges fullførte oppgaver, e-poster og kommentarer."
      />
    </div>
  ),
  "Horizontal - Contacts": (
    <div className="p-4">
      <EmptyState
        layout="horizontal"
        icons={[Users, Building2, Briefcase]}
        title="Ingen kontakter ennå"
        description="Legg til den første kontakten for å komme i gang."
        action={{ label: "Ny kontakt", onClick: () => console.log("clicked") }}
      />
    </div>
  ),
  "Vertical - Default": (
    <div className="p-4 max-w-md mx-auto">
      <EmptyState
        icons={[Rocket, Target, TrendingUp]}
        title="Ingen data"
        description="Kom i gang ved å legge til noe nytt."
        action={{ label: "Legg til", onClick: () => console.log("clicked") }}
      />
    </div>
  ),
  "Vertical - Small": (
    <div className="p-4 max-w-md mx-auto">
      <EmptyState
        size="sm"
        icons={[Rocket, Target, TrendingUp]}
        title="Ingen data"
        description="Kom i gang ved å legge til noe nytt."
      />
    </div>
  ),
  "Vertical - Large": (
    <div className="p-4 max-w-lg mx-auto">
      <EmptyState
        size="lg"
        icons={[Rocket, Target, TrendingUp]}
        title="Ingen data ennå"
        description="Dette er en større versjon av empty state komponenten med mer plass."
        action={{ label: "Kom i gang", onClick: () => console.log("clicked") }}
      />
    </div>
  ),
  "Vertical - Single Icon": (
    <div className="p-4 max-w-md mx-auto">
      <EmptyState
        icons={[Calendar]}
        title="Ingen hendelser"
        description="Kalenderen din er tom."
      />
    </div>
  ),
};
