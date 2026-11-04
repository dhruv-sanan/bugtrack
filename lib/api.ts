import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type {
  CreateProjectInput,
  CreateTicketInput,
  CreateUserInput,
  LoginInput,
  RegisterInput,
  TicketListQuery,
  UpdateProjectInput,
  UpdateTicketInput,
  UpdateUserInput,
  UserListQuery,
} from "@/shared/schemas";
import type { Paginated, Person, Project, Ticket, User } from "./types";

const rawBaseQuery = fetchBaseQuery({ baseUrl: "/api" });

/**
 * `getMe` must not reset, or it would refetch, get 401 and reset forever.
 * A failed `login` is also a 401, and belongs to the form as an error message.
 */
const ENDPOINTS_WHERE_401_IS_EXPECTED = new Set(["getMe", "login", "register", "logout"]);

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  queryApi,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, queryApi, extraOptions);
  if (result.error?.status === 401 && !ENDPOINTS_WHERE_401_IS_EXPECTED.has(queryApi.endpoint)) {
    // The session ended. `getMe` refetches, gets 401, and the route guard redirects.
    queryApi.dispatch(api.util.resetApiState());
  }
  return result;
};

const unwrap = <T>(response: { data: T }) => response.data;

const LIST = "LIST";

export type ListTicketsArgs = Partial<TicketListQuery>;
export type ListUsersArgs = Partial<UserListQuery>;
export type ListProjectsArgs = { page?: number; limit?: number };

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Me", "User", "Project", "Member", "Ticket"],
  endpoints: (build) => ({
    getMe: build.query<User, void>({
      query: () => "/auth/me",
      transformResponse: unwrap<User>,
      providesTags: ["Me"],
    }),
    login: build.mutation<User, LoginInput>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: unwrap<User>,
      onQueryStarted: startSession,
    }),
    register: build.mutation<User, RegisterInput>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      transformResponse: unwrap<User>,
      onQueryStarted: startSession,
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      // After the response, or `getMe` refetches with a still-valid cookie.
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(api.util.resetApiState());
      },
    }),

    listUsers: build.query<Paginated<User>, ListUsersArgs>({
      query: (params) => ({ url: "/users", params }),
      providesTags: ["User"],
    }),
    createUser: build.mutation<User, CreateUserInput>({
      query: (body) => ({ url: "/users", method: "POST", body }),
      transformResponse: unwrap<User>,
      invalidatesTags: ["User"],
    }),
    updateUser: build.mutation<User, { id: number } & UpdateUserInput>({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: "PATCH", body }),
      transformResponse: unwrap<User>,
      // Names and emails also appear on tickets and member lists.
      invalidatesTags: ["User", "Me", "Member", "Ticket"],
    }),
    deleteUser: build.mutation<void, number>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      // Deleting a user clears them from tickets and changes member counts.
      invalidatesTags: ["User", "Member", "Project", "Ticket"],
    }),

    listProjects: build.query<Paginated<Project>, ListProjectsArgs>({
      query: (params) => ({ url: "/projects", params }),
      providesTags: [{ type: "Project", id: LIST }],
    }),
    getProject: build.query<Project, number>({
      query: (id) => `/projects/${id}`,
      transformResponse: unwrap<Project>,
      providesTags: (_result, _error, id) => [{ type: "Project", id }],
    }),
    createProject: build.mutation<Project, CreateProjectInput>({
      query: (body) => ({ url: "/projects", method: "POST", body }),
      transformResponse: unwrap<Project>,
      invalidatesTags: [{ type: "Project", id: LIST }],
    }),
    updateProject: build.mutation<Project, { id: number } & UpdateProjectInput>({
      query: ({ id, ...body }) => ({ url: `/projects/${id}`, method: "PATCH", body }),
      transformResponse: unwrap<Project>,
      // Tickets carry the project's key and name.
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Project", id },
        { type: "Project", id: LIST },
        "Ticket",
      ],
    }),
    deleteProject: build.mutation<void, number>({
      query: (id) => ({ url: `/projects/${id}`, method: "DELETE" }),
      // Lists only: refetching the deleted project would flash a 404 before navigating away.
      invalidatesTags: [
        { type: "Project", id: LIST },
        { type: "Ticket", id: LIST },
      ],
    }),

    listMembers: build.query<Person[], number>({
      query: (projectId) => `/projects/${projectId}/members`,
      transformResponse: unwrap<Person[]>,
      providesTags: ["Member"],
    }),
    addMember: build.mutation<Person, { projectId: number; userId: number }>({
      query: ({ projectId, userId }) => ({
        url: `/projects/${projectId}/members`,
        method: "POST",
        body: { userId },
      }),
      transformResponse: unwrap<Person>,
      invalidatesTags: (_result, _error, { projectId }) => [
        "Member",
        { type: "Project", id: projectId },
        { type: "Project", id: LIST },
      ],
    }),
    removeMember: build.mutation<void, { projectId: number; userId: number }>({
      query: ({ projectId, userId }) => ({
        url: `/projects/${projectId}/members/${userId}`,
        method: "DELETE",
      }),
      // Removing a member also unassigns their tickets in that project.
      invalidatesTags: (_result, _error, { projectId }) => [
        "Member",
        { type: "Project", id: projectId },
        { type: "Project", id: LIST },
        "Ticket",
      ],
    }),

    listTickets: build.query<Paginated<Ticket>, ListTicketsArgs>({
      query: (params) => ({ url: "/tickets", params }),
      providesTags: [{ type: "Ticket", id: LIST }],
    }),
    getTicket: build.query<Ticket, number>({
      query: (id) => `/tickets/${id}`,
      transformResponse: unwrap<Ticket>,
      providesTags: (_result, _error, id) => [{ type: "Ticket", id }],
    }),
    createTicket: build.mutation<Ticket, CreateTicketInput>({
      query: (body) => ({ url: "/tickets", method: "POST", body }),
      transformResponse: unwrap<Ticket>,
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Ticket", id: LIST },
        { type: "Project", id: projectId },
        { type: "Project", id: LIST },
      ],
    }),
    updateTicket: build.mutation<Ticket, { id: number } & UpdateTicketInput>({
      query: ({ id, ...body }) => ({ url: `/tickets/${id}`, method: "PATCH", body }),
      transformResponse: unwrap<Ticket>,
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Ticket", id },
        { type: "Ticket", id: LIST },
      ],
      async onQueryStarted({ id, ...patch }, { dispatch, getState, queryFulfilled }) {
        // The assignee object cannot be built client-side, so it waits for the refetch.
        const optimistic: UpdateTicketInput = { ...patch };
        delete optimistic.assigneeId;
        const lists = api.util
          .selectInvalidatedBy(getState(), [{ type: "Ticket", id: LIST }])
          .filter(({ endpointName }) => endpointName === "listTickets");

        const patches = [
          dispatch(
            api.util.updateQueryData("getTicket", id, (ticket) => {
              Object.assign(ticket, optimistic);
            }),
          ),
          ...lists.map(({ originalArgs }) =>
            dispatch(
              api.util.updateQueryData("listTickets", originalArgs, (page) => {
                const ticket = page.data.find((candidate) => candidate.id === id);
                if (ticket) Object.assign(ticket, optimistic);
              }),
            ),
          ),
        ];
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((applied) => applied.undo());
        }
      },
    }),
    deleteTicket: build.mutation<void, { id: number; projectId: number }>({
      query: ({ id }) => ({ url: `/tickets/${id}`, method: "DELETE" }),
      // Lists only: refetching the deleted ticket would flash a 404 before navigating away.
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Ticket", id: LIST },
        { type: "Project", id: projectId },
        { type: "Project", id: LIST },
      ],
    }),
  }),
});

/** Clears the previous user's cache, so one account's data never shows to the next. */
async function startSession(
  _arg: unknown,
  {
    dispatch,
    queryFulfilled,
  }: {
    // Typed loosely because RTK Query's lifecycle API type is specific to each endpoint.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dispatch: any;
    queryFulfilled: Promise<{ data: User }>;
  },
) {
  try {
    const { data: user } = await queryFulfilled;
    dispatch(api.util.resetApiState());
    dispatch(api.util.upsertQueryData("getMe", undefined, user));
  } catch {
    // The form shows the error through the mutation's own promise.
  }
}

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useListUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useListProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useListMembersQuery,
  useAddMemberMutation,
  useRemoveMemberMutation,
  useListTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useDeleteTicketMutation,
} = api;
