import type { NpcProfile as Details } from '../rules/npcs';

export function NpcProfile({ profile }: { profile: Details }) {
  return (
    <>
      {profile.appearance && <p className="small muted">{profile.appearance}</p>}
      {profile.secret && (
        <details className="small">
          <summary>Show secret (DM)</summary>
          <p>{profile.secret}</p>
        </details>
      )}
    </>
  );
}
