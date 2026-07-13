import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import StudentScreenHeader from '../components/StudentScreenHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../styles/theme';

const HIDDEN_GROUP_STATUSES = new Set([
  'archived',
  'deleted',
  'inactive',
  'removed',
  'disabled',
]);

const FILTERS = [
  { key: 'all', label: 'Lahat' },
  { key: 'todo', label: 'Gagawin' },
  { key: 'pending', label: 'Nakabinbin' },
  { key: 'done', label: 'Tapos' },
];

function isVisibleGrupoRecord(item) {
  if (!item) return false;

  const status = String(
    item.status ||
    item.state ||
    item.visibility ||
    ''
  ).trim().toLowerCase();

  return !(
    HIDDEN_GROUP_STATUSES.has(status) ||
    item.deletedAt ||
    item.deleted_at ||
    item.archivedAt ||
    item.archived_at ||
    item.removedAt ||
    item.removed_at ||
    item.isDeleted ||
    item.deleted ||
    item.isArchived ||
    item.archived
  );
}

function getVisibleGroups(rawGroups = []) {
  return (Array.isArray(rawGroups) ? rawGroups : [])
    .filter(isVisibleGrupoRecord)
    .map((group) => ({
      ...group,
      tasks: (Array.isArray(group.tasks) ? group.tasks : [])
        .filter(isVisibleGrupoRecord),
    }));
}

function getTaskBucket(task) {
  if (task?.completed) return 'done';
  if (task?.pendingTeacherCheck) return 'pending';
  return 'todo';
}

function taskStatus(task) {
  if (task.completed) return 'Inaprubahan';
  if (task.pendingTeacherCheck) return 'Nakabinbin para sa pagsusuri ng guro';
  if (task.returnedByTeacher) return 'Ibinalik upang itama';
  return 'Hindi pa naipapasa';
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function taskSearchText(task) {
  return normalizeText([
    task?.title,
    task?.description,
    taskStatus(task),
    task?.xpReward,
  ].join(' '));
}

export default function GroupsScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  // MOBILE_G12_GROUP_ROLE_TO_TASK_V1
  const [juniorGroupStepById, setJuniorGroupStepById] = useState({});
  const [juniorGroupRoleById, setJuniorGroupRoleById] = useState({});
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedGrupoId, setSelectedGrupoId] = useState(null);
  const [missionStep, setMissionStep] = useState('choose');
  const [selectedRole, setSelectedRole] = useState(null);
  const [completedTaskId, setCompletedTaskId] = useState(null);

  const TEAM_ROLES = [
    {
      key: 'reader',
      icon: '📖',
      title: 'Tagabasa',
      description: 'Basahin ang salita o kuwento.',
    },
    {
      key: 'speaker',
      icon: '🎤',
      title: 'Tagapagsalita',
      description: 'Bigkasin ang sagot nang malinaw.',
    },
    {
      key: 'helper',
      icon: '⭐',
      title: 'Katulong',
      description: 'Tumulong sa kaklase.',
    },
    {
      key: 'checker',
      icon: '✅',
      title: 'Tagasuri',
      description: 'Tingnan kung tapos na ang gawain.',
    },
  ];


  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError('');

    try {
      const dashboard = await api('/dashboard');
      setGroups(getVisibleGroups(dashboard.groups));
      setStudent(dashboard.student || null);
    } catch (err) {
      setError('Hindi makuha ang mga gawain ng grupo. Pakisubukan muli.');
    } finally {
      if (!quiet) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load({ quiet: true });
  }, [load]);

  async function complete(taskId) {
    if (busyTaskId) return;

    setBusyTaskId(taskId);
    setNotice(null);

    try {
      const data = await api(`/groups/tasks/${taskId}/complete`, { method: 'POST' });
      setNotice({
        tone: 'success',
        message: data.message || 'Naipasa na para sa pagsusuri ng guro.',
      });

      setCompletedTaskId(taskId);
      setMissionStep('done');

      await load({ quiet: true });
    } catch (err) {
      setNotice({
        tone: 'error',
        message: err.message || 'Hindi maipasa ang gawaing ito.',
      });
    } finally {
      setBusyTaskId(null);
    }
  }

  const summary = useMemo(() => {
    const tasks = groups.flatMap((group) => group.tasks || []);

    return {
      groups: groups.length,
      todo: tasks.filter((task) => getTaskBucket(task) === 'todo').length,
      pending: tasks.filter((task) => getTaskBucket(task) === 'pending').length,
      done: tasks.filter((task) => getTaskBucket(task) === 'done').length,
    };
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const search = normalizeText(query);

    return groups
      .map((group) => {
        const tasks = Array.isArray(group.tasks) ? group.tasks : [];
        const groupMatches = !search || normalizeText([
          group.name,
          group.description,
          group.currentStudentIsLeader ? 'leader' : 'member',
        ].join(' ')).includes(search);

        const filteredTasks = tasks.filter((task) => {
          const bucket = getTaskBucket(task);
          const matchesFilter = statusFilter === 'all' || bucket === statusFilter;
          const matchesSearch = !search || groupMatches || taskSearchText(task).includes(search);

          return matchesFilter && matchesSearch;
        });

        if (statusFilter === 'all' && groupMatches) {
          return { ...group, tasks };
        }

        if (filteredTasks.length) {
          return { ...group, tasks: filteredTasks };
        }

        return null;
      })
      .filter(Boolean);
  }, [groups, query, statusFilter]);

  const hasFilters = Boolean(query.trim()) || statusFilter !== 'all';

  const selectedGrupo =
    filteredGroups.find(
      (group) => Number(group.id) === Number(selectedGrupoId)
    ) || null;

  function clearFilters() {
    setQuery('');
    setStatusFilter('all');
  }

  function renderFilterChip(item) {
    const active = statusFilter === item.key;

    return (
      <TouchableOpacity
        key={item.key}
        style={[styles.filterChip, active && styles.filterChipActive]}
        onPress={() => setStatusFilter(item.key)}
        activeOpacity={0.85}
      >
        <Text style={[styles.filterText, active && styles.filterTextActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  }



  function chooseJuniorGroupRole(group, role) {
    const gradeLevel = Number(
      student?.gradeLevel ||
      student?.grade ||
      0
    );

    if (
      ![1, 2].includes(gradeLevel) ||
      !group?.id ||
      !role
    ) {
      return;
    }

    const groupKey = String(group.id);

    setJuniorGroupRoleById((current) => ({
      ...current,
      [groupKey]: role,
    }));

    setJuniorGroupStepById((current) => ({
      ...current,
      [groupKey]: 'task',
    }));
  }

  function returnToJuniorGroupRoles(groupId) {
    const groupKey = String(groupId || '');

    setJuniorGroupStepById((current) => ({
      ...current,
      [groupKey]: 'role',
    }));
  }

  function renderJuniorGroupTask(group) {
    const tasks = Array.isArray(group?.tasks)
      ? group.tasks
      : [];

    const task =
      tasks.find(
        (item) =>
          !item.completed &&
          !item.pendingTeacherCheck
      ) ||
      tasks.find((item) => !item.completed) ||
      tasks[0] ||
      null;

    const groupKey = String(group?.id || '');
    const selectedRole =
      juniorGroupRoleById[groupKey] || null;

    const selectedRoleLabel =
      selectedRole?.title ||
      selectedRole?.label ||
      selectedRole?.name ||
      '';

    return (
      <View>
        <Card>
          <Text style={styles.cardTitle}>
            🧩 Oras ng pagtutulungan!
          </Text>

          <Text style={styles.muted}>
            Gawin ang misyon nang magkakasama.
          </Text>

          {selectedRole ? (
            <View
              style={{
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 14,
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 999,
                backgroundColor: '#FFF7D6',
                borderWidth: 1,
                borderColor: '#F4D77A',
              }}
            >
              <Text
                style={{
                  color: '#334155',
                  fontWeight: '900',
                }}
              >
                Tungkulin: {selectedRole.icon || '⭐'}{' '}
                {selectedRoleLabel}
              </Text>
            </View>
          ) : null}
        </Card>

        {task ? (
          renderTask(group, task)
        ) : (
          <Card>
            <View style={styles.emptyMini}>
              <Text style={styles.emptyMiniTitle}>
                Wala pang misyon
              </Text>

              <Text style={styles.muted}>
                Maaaring magdagdag ang guro.
              </Text>
            </View>
          </Card>
        )}

        <TouchableOpacity
          activeOpacity={0.86}
          style={[
            styles.primaryButton,
            {
              marginTop: 12,
              backgroundColor: '#E2E8F0',
            },
          ]}
          onPress={() => returnToJuniorGroupRoles(group?.id)}
        >
          <Text
            style={[
              styles.primaryButtonText,
              { color: '#0F172A' },
            ]}
          >
            Bumalik
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderTask(group, task) {
    const bucket = getTaskBucket(task);
    const isBusy = busyTaskId === task.id;
    const canSubmit = group.currentStudentIsLeader && !task.completed && !task.pendingTeacherCheck;

    return (
      <Card key={task.id} style={styles.inner}>
        <View style={styles.taskHeader}>
          <Text style={styles.task}>{task.title}</Text>
          <View style={[styles.statusPill, bucket === 'done' && styles.statusTapos, bucket === 'pending' && styles.statusNakabinbin]}>
            <Text style={[styles.statusPillText, bucket === 'done' && styles.statusTaposText, bucket === 'pending' && styles.statusNakabinbinText]}>
              {taskStatus(task)}
            </Text>
          </View>
        </View>

        {task.description ? (
          <Text style={styles.taskDescription}>{task.description}</Text>
        ) : (
          <Text style={styles.muted}>
            Tapusin ang gawaing ito kasama ang iyong mga kagrupo.
          </Text>
        )}

        <View style={styles.taskFooter}>
          <Text style={styles.taskXp}>+{task.xpReward || 0} XP</Text>
          {task.returnedByTeacher ? (
            <Text style={styles.revisionText}>Kailangang Ayusin</Text>
          ) : null}
        </View>

        {canSubmit && (
          <PrimaryButton variant="secondary" onPress={() => complete(task.id)}>
            {isBusy ? 'Isinusumite...' : 'Nakatulong ako sa aming pangkat!'}
          </PrimaryButton>
        )}
      </Card>
    );
  }


  function renderTrabahoSelection(group) {
    const juniorGradeLevel = Number(
      student?.gradeLevel ||
      student?.grade ||
      0
    );

    const juniorGroupKey = String(group?.id || '');
    const juniorGroupStep =
      juniorGroupStepById[juniorGroupKey] || 'role';

    if (
      [1, 2].includes(juniorGradeLevel) &&
      juniorGroupStep === 'task'
    ) {
      return renderJuniorGroupTask(group);
    }

    return (
      <Card style={[styles.jobScreen, styles.roleSelectionPanel]}>
        {/* MOBILE_ROLE_SELECTION_FILIPINO_V2 */}
        <View style={styles.roleSelectionHeadingRow}>
          <View style={styles.roleSelectionHeadingIcon}>
            <Text style={styles.roleSelectionHeadingEmoji}>⭐</Text>
          </View>
          <View style={styles.roleSelectionHeadingCopy}>
            <Text style={[styles.jobTitle, styles.roleSelectionTitle]}>
              Pumili ng Tungkulin
            </Text>
            <Text style={[styles.jobSubtitle, styles.roleSelectionSubtitle]}>
              Piliin ang iyong tungkulin.
            </Text>
          </View>
        </View>

        <View style={[styles.jobGrid, styles.roleSelectionGrid]}>
          {TEAM_ROLES.map((role) => (
            <TouchableOpacity
              key={role.key}
              style={[styles.jobCard, styles.roleSelectionOption]}
              onPress={() => {
                setSelectedRole(role);
                setMissionStep('task');
                chooseJuniorGroupRole(group, role);
              }}
            >
              <Text style={[styles.jobIcon, styles.roleSelectionIcon]}>
                {role.icon}
              </Text>

              <Text style={[styles.jobCardTitle, styles.roleSelectionRoleTitle]}>
                {role.title}
              </Text>

              <Text style={[styles.jobCardDescription, styles.roleSelectionRoleDescription]}>
                {role.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    );
  }


  function renderWaitingForTeacher() {
    return (
      <Card style={styles.waitingCard}>
        <Text style={styles.waitingIcon}>
          🎉
        </Text>

        <Text style={styles.waitingTitle}>
          Naghihintay sa Teacher
        </Text>

        <Text style={styles.waitingSubtitle}>
          Susuriin ng iyong guro ang ginawa ng inyong pangkat.
        </Text>

        <PrimaryButton
          onPress={() => {
            setMissionStep('choose');
            setSelectedRole(null);
            setSelectedGrupoId(null);
            setCompletedTaskId(null);
          }}
        >
          <Text style={styles.primaryButtonText}>Bumalik sa mga Pangkat</Text>
        </PrimaryButton>
      </Card>
    );
  }

  function renderGrupo(group) {
    const tasks = Array.isArray(group.tasks) ? group.tasks : [];
    const memberCount = Array.isArray(group.members) ? group.members.length : 0;

    return (
      <Card key={group.id} style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <View style={styles.groupIconWrap}>
            <Text style={styles.groupIcon}>🤝</Text>
          </View>

          <View style={styles.groupTitleBlock}>
            <Text style={styles.group}>{group.name}</Text>
            <Text style={styles.muted}>
              {group.description || 'Ang iyong nakatalagang pangkat sa pag-aaral.'}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Text style={styles.metaText}>{tasks.length} gawain</Text>
          </View>
          {memberCount > 0 ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>{memberCount} miyembro</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.role}>
          {group.currentStudentIsLeader
            ? 'Ikaw ang pinuno ng pangkat. Ipasa ang mga natapos na gawain para sa pagsusuri ng guro.'
            : 'Makipagtulungan sa iyong mga kagrupo. Ang pinuno ng pangkat ang magsusumite ng mga gawain.'}
        </Text>

        {tasks.map((task) => renderTask(group, task))}

        {tasks.length === 0 && (
          <View style={styles.emptyMini}>
            <Text style={styles.emptyMiniTitle}>Wala pang gawain rito.</Text>
            <Text style={styles.muted}>
              {hasFilters
                ? 'Subukan ang ibang paghahanap o filter.'
                : 'Wala pang nakatalagang gawain sa grupong ito.'}
            </Text>
          </View>
        )}
      </Card>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.secondary]}
            tintColor={colors.secondary}
          />
        }
      >
        <StudentScreenHeader
          navigation={navigation}
          avatar={student?.avatar}
          gradeLevel={student?.gradeLevel}
        />

        <View style={styles.header}>
          <View style={styles.heroCard}>
            <Text style={styles.title}>👥 Mga Gawain ng Pangkat</Text>
            <Text style={styles.muted}>
              Makipagtulungan, subaybayan ang progreso, at isumite ang mga gawain para sa pag-apruba ng guro.
            </Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.groups}</Text>
                <Text style={styles.summaryLabel}>Mga Pangkat</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.todo}</Text>
                <Text style={styles.summaryLabel}>Gagawin</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.pending}</Text>
                <Text style={styles.summaryLabel}>Nakabinbin</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.done}</Text>
                <Text style={styles.summaryLabel}>Tapos</Text>
              </View>
            </View>
          </View>
        </View>

        <Card style={styles.toolsCard}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Maghanap ng pangkat o gawain"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map(renderFilterChip)}
          </ScrollView>
        </Card>

        {notice ? (
          <View style={[styles.notice, notice.tone === 'error' && styles.noticeError]}>
            <Text style={[styles.noticeText, notice.tone === 'error' && styles.noticeErrorText]}>
              {notice.message}
            </Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.muted}>Kinukuha ang mga gawain ng grupo...</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.error}>Hindi makuha ang mga gawain ng grupo. Pakisubukan muli.</Text>
            <PrimaryButton variant="secondary" onPress={() => load()}>
              <Text style={styles.primaryButtonText}>Subukan Muli</Text>
            </PrimaryButton>
          </Card>
        ) : filteredGroups.length ? (
          <>
            <Card style={styles.teamMissionCard}>
              <Text style={styles.teamMissionTitle}>
                👥 Gawain ng Pangkat
              </Text>

              <Text style={styles.teamMissionSubtitle}>
                Pumili. Tumulong. Isumite.
              </Text>

              <View style={styles.stepRow}>
                <View style={styles.stepPill}>
                  <Text style={styles.stepText}>Pumili</Text>
                </View>

                <View style={styles.stepPill}>
                  <Text style={styles.stepText}>Tungkulin</Text>
                </View>

                <View style={styles.stepPill}>
                  <Text style={styles.stepText}>Gawain</Text>
                </View>

                <View style={styles.stepTapos}>
                  <Text style={styles.stepTaposText}>
                    Tapos ({summary.done})
                  </Text>
                </View>
              </View>

              {filteredGroups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={styles.teamCard}
                  onPress={() => {
                    setSelectedGrupoId(group.id);
                    setMissionStep('job');
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.group}>
                      👥 {group.name}
                    </Text>

                    <Text style={styles.muted}>
                      {(group.tasks || []).filter(
                        (task) => !task.completed
                      ).length} natitirang gawain
                    </Text>
                  </View>

                  <Text style={styles.teamArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </Card>

            {missionStep === 'job' && selectedGrupo
              ? renderTrabahoSelection(selectedGrupo)
              : null}

            {missionStep === 'task' && selectedGrupo
              ? renderGrupo(selectedGrupo)
              : null}

            {missionStep === 'done'
              ? renderWaitingForTeacher()
              : null}
          </>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔎</Text>
            <Text style={styles.emptyTitle}>
              {groups.length ? 'Walang katugmang gawain ng grupo.' : 'Wala ka pang nakatalagang grupo.'}
            </Text>
            <Text style={styles.muted}>
              {groups.length
                ? 'Subukan ang ibang paghahanap o filter upang makita ang gawain ng inyong grupo.'
                : 'Maaaring idagdag ka ng iyong guro sa isang grupo at bigyan ng mga gawaing pangkatan.'}
            </Text>

            {hasFilters ? (
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters} activeOpacity={0.85}>
                <Text style={styles.clearButtonText}>Burahin ang paghahanap at mga salaan</Text>
              </TouchableOpacity>
            ) : null}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // MOBILE_ROLE_SELECTION_FILIPINO_V2
  roleSelectionPanel: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: '#F9FFFC',
    borderWidth: 1,
    borderColor: '#DDF4E7',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  roleSelectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  roleSelectionHeadingIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#FFF8DC',
    borderWidth: 1,
    borderColor: '#F8DEA0',
  },
  roleSelectionHeadingEmoji: {
    fontSize: 30,
  },
  roleSelectionHeadingCopy: {
    flex: 1,
    minWidth: 0,
  },
  roleSelectionTitle: {
    color: '#0F2742',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginBottom: 4,
  },
  roleSelectionSubtitle: {
    color: '#5D7090',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    marginBottom: 0,
  },
  roleSelectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    marginHorizontal: -4,
  },
  roleSelectionOption: {
    flexBasis: '46%',
    flexGrow: 1,
    minWidth: 132,
    minHeight: 154,
    marginHorizontal: 4,
    marginBottom: 10,
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DDF4E7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#166534',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  roleSelectionIcon: {
    fontSize: 42,
    lineHeight: 50,
    marginBottom: 8,
    textAlign: 'center',
  },
  roleSelectionRoleTitle: {
    color: '#0F2742',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  roleSelectionRoleDescription: {
    color: '#5D7090',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },

  safe: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },
  screen: { flex: 1, backgroundColor: '#F6FFF5' },
  content: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 14,
  },
  heroCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 28,
    padding: 14,
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.ink,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  toolsCard: {
    marginBottom: 18,
  },
  searchInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#DDE7D8',
    borderWidth: 1,
    borderRadius: 18,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterRow: {
    gap: 8,
    paddingTop: 12,
  },
  filterChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: colors.secondary,
  },
  filterText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  notice: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 18,
    padding: 13,
    marginBottom: 14,
  },
  noticeError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  noticeText: {
    color: '#166534',
    fontWeight: '800',
  },
  noticeErrorText: {
    color: '#B91C1C',
  },
  groupCard: {
    marginBottom: 18,
  },
  groupHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  groupIconWrap: {
    backgroundColor: '#DCFCE7',
    borderRadius: 26,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupIcon: {
    fontSize: 22,
  },
  groupTitleBlock: {
    flex: 1,
  },
  group: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  muted: {
    color: colors.muted,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  role: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  inner: {
    backgroundColor: '#fff7df',
    marginTop: 12,
  },
  taskHeader: {
    gap: 8,
    marginBottom: 8,
  },
  task: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  taskDescription: {
    color: colors.ink,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    gap: 10,
  },
  taskXp: {
    color: colors.green,
    fontWeight: '900',
  },
  revisionText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '900',
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusNakabinbin: {
    backgroundColor: '#FEF3C7',
  },
  statusTapos: {
    backgroundColor: '#DCFCE7',
  },
  statusPillText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
  },
  statusNakabinbinText: {
    color: '#B45309',
  },
  statusTaposText: {
    color: '#166534',
  },
  emptyMini: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    marginTop: 12,
    padding: 14,
  },
  emptyMiniTitle: {
    color: colors.ink,
    fontWeight: '900',
    marginBottom: 4,
  },
  center: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  errorCard: {
    gap: 12,
  },
  error: {
    color: '#B91C1C',
    textAlign: 'center',
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyIcon: {
    fontSize: 34,
    marginBottom: 8,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },


  jobScreen: {
    marginBottom: 14,
  },

  jobTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 6,
  },

  jobSubtitle: {
    color: colors.muted,
    marginBottom: 18,
  },

  jobGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  jobCard: {
    width: '48%',
    backgroundColor: '#F8FFFA',
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    alignItems: 'center',
  },

  jobIcon: {
    fontSize: 34,
    marginBottom: 10,
  },

  jobCardTitle: {
    color: colors.ink,
    fontWeight: '900',
    marginBottom: 6,
  },

  jobCardDescription: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },


  waitingCard: {
    alignItems: 'center',
    paddingVertical: 22,
    marginBottom: 18,
  },

  waitingIcon: {
    fontSize: 60,
    marginBottom: 12,
  },

  waitingTitle: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
  },

  waitingSubtitle: {
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 20,
  },

  teamMissionCard: {
    marginBottom: 18,
  },

  teamMissionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
  },

  teamMissionSubtitle: {
    color: colors.muted,
    marginBottom: 16,
  },

  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },

  stepPill: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#DDE7D8',
    paddingVertical: 12,
    alignItems: 'center',
  },

  stepText: {
    fontWeight: '900',
    color: colors.ink,
  },

  stepTapos: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },

  stepTaposText: {
    fontWeight: '900',
    color: '#166534',
  },

  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FFFA',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },

  teamArrow: {
    fontSize: 22,
    fontWeight: '900',
  },


  // [MODERN_STUDENT_UI_OVERRIDES_START]
  safe: {
    flex: 1,
    backgroundColor: '#ECFDF5',
  },

  screen: {
    flex: 1,
    backgroundColor: '#ECFDF5',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 26,
    paddingBottom: 120,
  },

  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
    marginBottom: 16,
  },

  title: {
    color: '#0F172A',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  summaryValue: {
    color: '#16A34A',
    fontSize: 22,
    fontWeight: '900',
  },

  summaryLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 3,
    textAlign: 'center',
  },

  toolsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },

  searchInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 22,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  filterChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },

  filterChipActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },

  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  groupIconWrap: {
    backgroundColor: '#DCFCE7',
    borderRadius: 24,
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },

  group: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
    color: '#0F172A',
  },

  inner: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 15,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  task: {
    color: '#0F172A',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },

  jobCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  waitingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
  },

  teamMissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
  },

  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  // [MODERN_STUDENT_UI_OVERRIDES_END]


  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
  },

});
