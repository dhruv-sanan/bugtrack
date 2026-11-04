import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { api } from "./api";

export type TicketView = "board" | "list";

const uiSlice = createSlice({
  name: "ui",
  initialState: { ticketView: "board" as TicketView },
  reducers: {
    setTicketView(state, action: PayloadAction<TicketView>) {
      state.ticketView = action.payload;
    },
  },
});

export const { setTicketView } = uiSlice.actions;

export function makeStore() {
  return configureStore({
    reducer: { [api.reducerPath]: api.reducer, ui: uiSlice.reducer },
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });
}

type Store = ReturnType<typeof makeStore>;

export const useAppDispatch = useDispatch.withTypes<Store["dispatch"]>();
export const useAppSelector = useSelector.withTypes<ReturnType<Store["getState"]>>();
