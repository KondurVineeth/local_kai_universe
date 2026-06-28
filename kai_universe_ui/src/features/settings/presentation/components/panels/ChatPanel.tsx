import {
  aiGeneratedChatNamesChanged,
  allowOnlyOneNewEmptyChatChanged,
  alwaysShowPromptTemplateInSidebarChanged,
  cmdRToRegenerateChanged,
  doubleClickChatFolderRenamesChanged,
  doubleClickToEditMessageChanged,
  moveDeletedChatsToTrashChanged,
  shiftEnterToSendChanged,
  showTokenCountInChatListingsChanged,
  sidebarSortChanged,
  sidebarSortOrderChanged,
  unloadCurrentModelOnSelectChanged,

  selectAiGeneratedChatNames,
  selectAllowOnlyOneNewEmptyChat,
  selectAlwaysShowPromptTemplateInSidebar,
  selectCmdRToRegenerate,
  selectDoubleClickChatFolderRenames,
  selectDoubleClickToEditMessage,
  selectMoveDeletedChatsToTrash,
  selectShiftEnterToSend,
  selectShowTokenCountInChatListings,
  selectSidebarSort,
  selectSidebarSortOrder,
  selectUnloadCurrentModelOnSelect} from '@features/settings';
import { Select, Switch } from '@shared/ds/primitives';
import { cn } from '@shared/lib/cn';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';

import { KeyBadge, PanelLayout, RadioRow, SettingGroup, SettingRow } from '../shared/SettingsPrimitives';

import type { AiGeneratedChatNames, SidebarSort, SidebarSortOrder } from '@features/settings';

export function ChatPanel() {
  return (
    <PanelLayout title="Chat">
      <ChatSettingsGroup />
      <KeyboardShortcutsGroup />
      <ConversationAutoNamingGroup />
    </PanelLayout>
  );
}

function ChatSettingsGroup() {
  return (
    <SettingGroup sectionTitle="Chat Settings">
      <ChatToggleRows />
      <SidebarSortRow />
    </SettingGroup>
  );
}

function ChatToggleRows() {
  const dispatch = useAppDispatch();
  const allowOneEmpty = useAppSelector(selectAllowOnlyOneNewEmptyChat);
  const unloadOnSelect = useAppSelector(selectUnloadCurrentModelOnSelect);
  const moveToTrash = useAppSelector(selectMoveDeletedChatsToTrash);
  const dblClickEdit = useAppSelector(selectDoubleClickToEditMessage);
  const showTokenCount = useAppSelector(selectShowTokenCountInChatListings);
  const showPromptTemplate = useAppSelector(selectAlwaysShowPromptTemplateInSidebar);
  const dblClickRename = useAppSelector(selectDoubleClickChatFolderRenames);
  return (
    <>
      <SettingRow label="Allow only one new empty chat" sub="Allow at most one unsaved new chat tab at a time">
        <Switch
          checked={allowOneEmpty}
          onCheckedChange={(v) => dispatch(allowOnlyOneNewEmptyChatChanged(v))}
          aria-label="Allow only one new empty chat"
        />
      </SettingRow>
      <SettingRow label="When selecting a model to load, first unload any currently loaded ones">
        <Switch
          checked={unloadOnSelect}
          onCheckedChange={(v) => dispatch(unloadCurrentModelOnSelectChanged(v))}
          aria-label="Unload current model on select"
        />
      </SettingRow>
      <SettingRow
        label="Move deleted chats and folders to Trash"
        sub="Chats and folders you delete will be moved to your operating system's Trash bin."
      >
        <Switch
          checked={moveToTrash}
          onCheckedChange={(v) => dispatch(moveDeletedChatsToTrashChanged(v))}
          aria-label="Move deleted chats to trash"
        />
      </SettingRow>
      <SettingRow label="Double click on a chat message to edit">
        <Switch
          checked={dblClickEdit}
          onCheckedChange={(v) => dispatch(doubleClickToEditMessageChanged(v))}
          aria-label="Double click to edit message"
        />
      </SettingRow>
      <SettingRow label="Show token count in chat listings">
        <Switch
          checked={showTokenCount}
          onCheckedChange={(v) => dispatch(showTokenCountInChatListingsChanged(v))}
          aria-label="Show token count in chat listings"
        />
      </SettingRow>
      <SettingRow label="Always show prompt template in Chat sidebar">
        <Switch
          checked={showPromptTemplate}
          onCheckedChange={(v) => dispatch(alwaysShowPromptTemplateInSidebarChanged(v))}
          aria-label="Always show prompt template in sidebar"
        />
      </SettingRow>
      <SettingRow label="Double click chat/folder renames">
        <Switch
          checked={dblClickRename}
          onCheckedChange={(v) => dispatch(doubleClickChatFolderRenamesChanged(v))}
          aria-label="Double click chat folder renames"
        />
      </SettingRow>
    </>
  );
}

function SidebarSortRow() {
  const dispatch = useAppDispatch();
  const sort = useAppSelector(selectSidebarSort);
  const sortOrder = useAppSelector(selectSidebarSortOrder);
  return (
    <SettingRow label="Sidebar sort">
      <div className="flex items-center gap-2">
        <div className="w-36">
          <Select
            options={[
              { value: 'date-created', label: 'Date created' },
              { value: 'date-modified', label: 'Date modified' },
              { value: 'name', label: 'Name' },
            ]}
            value={sort}
            onChange={(e) => dispatch(sidebarSortChanged(e.target.value as SidebarSort))}
          />
        </div>
        <SortOrderToggle value={sortOrder} onChange={(v) => dispatch(sidebarSortOrderChanged(v))} />
      </div>
    </SettingRow>
  );
}

function SortOrderToggle({
  value,
  onChange,
}: {
  readonly value: SidebarSortOrder;
  readonly onChange: (v: SidebarSortOrder) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-md border border-border-default text-xs font-medium">
      {(['asc', 'desc'] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            'px-3 py-1 uppercase transition-colors',
            value === opt
              ? 'bg-accent text-fg-default'
              : 'bg-bg-raised text-fg-default hover:bg-bg-raised/80',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function KeyboardShortcutsGroup() {
  const dispatch = useAppDispatch();
  const shiftEnter = useAppSelector(selectShiftEnterToSend);
  const cmdR = useAppSelector(selectCmdRToRegenerate);
  return (
    <SettingGroup sectionTitle="Keyboard Shortcuts">
      <ShiftEnterRow dispatch={dispatch} shiftEnter={shiftEnter} />
      <CmdRRow dispatch={dispatch} cmdR={cmdR} />
    </SettingGroup>
  );
}

// Extracted to keep per-row logic clean
function ShiftEnterRow({
  dispatch,
  shiftEnter,
}: {
  readonly dispatch: ReturnType<typeof useAppDispatch>;
  readonly shiftEnter: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border-default px-4 py-3 first:border-t-0">
      <div className="flex items-center gap-1 text-sm text-fg-default">
        <span>Use</span>
        <KeyBadge>⇧</KeyBadge>
        <span>+</span>
        <KeyBadge>⏎</KeyBadge>
        <span>to send message</span>
      </div>
      <Switch
        checked={shiftEnter}
        onCheckedChange={(v) => dispatch(shiftEnterToSendChanged(v))}
        aria-label="Shift+Enter to send"
      />
    </div>
  );
}

function CmdRRow({
  dispatch,
  cmdR,
}: {
  readonly dispatch: ReturnType<typeof useAppDispatch>;
  readonly cmdR: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border-default px-4 py-3">
      <div className="flex items-center gap-1 text-sm text-fg-default">
        <span>Use</span>
        <KeyBadge>⌘</KeyBadge>
        <span>+</span>
        <KeyBadge>R</KeyBadge>
        <span>to regenerate the last message in chat</span>
      </div>
      <Switch
        checked={cmdR}
        onCheckedChange={(v) => dispatch(cmdRToRegenerateChanged(v))}
        aria-label="Cmd+R to regenerate"
      />
    </div>
  );
}

function ConversationAutoNamingGroup() {
  const dispatch = useAppDispatch();
  const value = useAppSelector(selectAiGeneratedChatNames);
  const options: Array<{ value: AiGeneratedChatNames; label: string; sub: string }> = [
    { value: 'never', label: 'Never', sub: "Don't create AI-generated chat names" },
    {
      value: 'auto',
      label: 'Auto',
      sub: 'Decides whether to create names based on generation speed',
    },
    {
      value: 'always',
      label: 'Always',
      sub: 'Create AI-generated chat names regardless of generation speed',
    },
  ];
  return (
    <SettingGroup sectionTitle="AI-Generated Chat Names">
      {options.map((opt) => (
        <RadioRow
          key={opt.value}
          label={opt.label}
          sub={opt.sub}
          selected={value === opt.value}
          onSelect={() => dispatch(aiGeneratedChatNamesChanged(opt.value))}
        />
      ))}
    </SettingGroup>
  );
}
