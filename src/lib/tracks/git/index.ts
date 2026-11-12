import type { QuizQuestion, Track } from "@/lib/tracks/types"

/**
 * A second, quiz-based track. It shows the platform isn't tied to Vim:
 * the same sidebar, Pro gating, practice, XP and stats all work for it.
 */

const q = (prompt: string, answer: string | string[], commands: string[], explain?: string, choices?: string[]): QuizQuestion => ({
  prompt,
  answer: Array.isArray(answer) ? answer : [answer],
  commands,
  explain,
  choices,
})

const BASICS = [
  q("Create a new, empty repository in the current folder.", "git init", ["init"]),
  q("Show which files are modified, staged or untracked.", "git status", ["status"]),
  q("Stage the file `app.ts` for the next commit.", "git add app.ts", ["add"]),
  q("Stage every change in the current directory.", ["git add .", "git add -A", "git add --all"], ["add"]),
  q('Commit the staged changes with the message "fix login".', ['git commit -m "fix login"', "git commit -m 'fix login'"], ["commit"]),
  q("Which command shows the commit history?", "git log", ["log"], undefined, ["git history", "git log", "git show-all", "git commits"]),
  q("Show the history condensed to one line per commit.", "git log --oneline", ["log"]),
]

const BRANCHING = [
  q("Create a branch called `feature` without switching to it.", "git branch feature", ["branch"]),
  q("Switch to the existing branch `feature`.", ["git switch feature", "git checkout feature"], ["switch"]),
  q("Create the branch `hotfix` and switch to it in one command.", ["git switch -c hotfix", "git checkout -b hotfix"], ["switch"]),
  q("Merge the branch `feature` into the current branch.", "git merge feature", ["merge"]),
  q("Delete the local branch `old` after it has been merged.", "git branch -d old", ["branch"]),
  q("What does `git rebase main` do?", "Replays your commits on top of main", ["rebase"], "Rebase moves your branch's commits so they start from the tip of main.", [
    "Deletes main",
    "Replays your commits on top of main",
    "Merges main into a new branch",
    "Resets main to your branch",
  ]),
]

const UNDOING = [
  q("Discard unstaged changes to `index.ts`.", ["git restore index.ts", "git checkout -- index.ts"], ["restore"]),
  q("Unstage `index.ts` but keep the changes.", ["git restore --staged index.ts", "git reset index.ts", "git reset HEAD index.ts"], ["restore"]),
  q("Temporarily shelve all uncommitted changes.", ["git stash", "git stash push"], ["stash"]),
  q("Re-apply the most recent stash and remove it from the stash list.", "git stash pop", ["stash"]),
  q("Change the message of the most recent commit.", ["git commit --amend", 'git commit --amend -m "msg"'], ["commit"]),
  q("Create a new commit that reverses commit `abc123`.", "git revert abc123", ["revert"]),
]

export const gitTrack: Track = {
  slug: "git",
  title: "Git",
  tagline: "The Git commands you use every day, drilled until you don't have to think.",
  description: "Recall-based drills for everyday Git: staging, committing, branching and undoing mistakes.",
  engine: "quiz",
  sections: [
    {
      title: "Foundations",
      lessons: [
        {
          slug: "first-commit",
          title: "Your First Commit",
          keys: ["init", "add", "commit"],
          pro: false,
          introduces: ["init", "status", "add", "commit", "log"],
          blocks: [
            { type: "p", text: "Every Git workflow comes down to three steps: **change** files, **stage** what you want to keep, and **commit** a snapshot." },
            { type: "code", text: "git init\ngit status\ngit add <file>\ngit commit -m \"message\"\ngit log --oneline" },
            { type: "callout", title: "Staging area", text: "`git add` doesn't save anything permanently. It builds up the next commit piece by piece." },
          ],
          challenge: { kind: "quiz", rounds: 6, instructions: ["Type the exact command, or pick the right answer."], questions: BASICS },
        },
        {
          slug: "branching",
          title: "Branching & Merging",
          keys: ["branch", "switch", "merge"],
          pro: false,
          introduces: ["branch", "switch", "merge", "rebase"],
          blocks: [
            { type: "p", text: "Branches are cheap pointers to commits. Make one for every feature or fix." },
            { type: "code", text: "git switch -c feature   # create + switch\ngit merge feature       # bring it back\ngit branch -d feature   # clean up" },
          ],
          challenge: { kind: "quiz", rounds: 6, instructions: ["Type the exact command, or pick the right answer."], questions: BRANCHING },
        },
      ],
    },
    {
      title: "Fixing Mistakes",
      lessons: [
        {
          slug: "undoing-things",
          title: "Undoing Things",
          keys: ["restore", "stash", "revert"],
          pro: true,
          introduces: ["restore", "stash", "revert"],
          blocks: [
            { type: "p", text: "Most mistakes in Git can be undone. The trick is knowing which tool matches which kind of mistake." },
            { type: "list", items: ["`restore` for files in your working tree or staging area", "`stash` to shelve work for later", "`commit --amend` to fix the last commit", "`revert` to safely undo a commit that's already been shared"] },
          ],
          challenge: { kind: "quiz", rounds: 6, instructions: ["Type the exact command, or pick the right answer."], questions: UNDOING },
        },
      ],
    },
  ],
  commands: [
    ...["init", "status", "add", "commit", "log"].map((id) => ({ id, name: `git ${id}`, label: id, group: "foundations", pro: false })),
    ...["branch", "switch", "merge", "rebase"].map((id) => ({ id, name: `git ${id}`, label: id, group: "branching", pro: false })),
    ...["restore", "stash", "revert"].map((id) => ({ id, name: `git ${id}`, label: id, group: "fixing mistakes", pro: true })),
  ],
  practice: [
    { id: "basics", label: "basics", pro: false, lessons: ["first-commit", "branching"] },
    { id: "undo", label: "undoing", pro: true, lessons: ["undoing-things"] },
  ],
}
