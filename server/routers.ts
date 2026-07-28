import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import * as sales from "./sales";
import { COOKIE_NAME } from "../shared/const";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * Sales sync router for cloud backup and cross-device sync
   */
  salesSync: router({
    /**
     * Get all sales records for the authenticated user
     */
    list: protectedProcedure.query(({ ctx }) => {
      return sales.getUserSalesRecords(ctx.user.id);
    }),

    /**
     * Create a new sales record
     */
    create: protectedProcedure
      .input(
        z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          time: z.string().regex(/^\d{2}:\d{2}$/),
          pricePerKg: z.string().transform((val) => parseFloat(val)),
          quantity: z.number().int().positive(),
          totalWeight: z.string().transform((val) => parseFloat(val)),
          totalAmount: z.string().transform((val) => parseFloat(val)),
          notes: z.string().optional(),
        }),
      )
      .mutation(({ ctx, input }) => {
        return sales.createSalesRecord({
          userId: ctx.user.id,
          date: input.date,
          time: input.time,
          pricePerKg: input.pricePerKg.toString(),
          quantity: input.quantity,
          totalWeight: input.totalWeight.toString(),
          totalAmount: input.totalAmount.toString(),
          notes: input.notes || null,
        });
      }),

    /**
     * Update a sales record
     */
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
          pricePerKg: z.string().transform((val) => parseFloat(val)).optional(),
          quantity: z.number().int().positive().optional(),
          totalWeight: z.string().transform((val) => parseFloat(val)).optional(),
          totalAmount: z.string().transform((val) => parseFloat(val)).optional(),
          notes: z.string().optional(),
        }),
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, any> = {};
        if (data.date !== undefined) updateData.date = data.date;
        if (data.time !== undefined) updateData.time = data.time;
        if (data.pricePerKg !== undefined) updateData.pricePerKg = data.pricePerKg.toString();
        if (data.quantity !== undefined) updateData.quantity = data.quantity;
        if (data.totalWeight !== undefined) updateData.totalWeight = data.totalWeight.toString();
        if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount.toString();
        if (data.notes !== undefined) updateData.notes = data.notes || null;
        return sales.updateSalesRecord(id, updateData);
      }),

    /**
     * Delete a sales record
     */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => {
        return sales.deleteSalesRecord(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
