
-- Add DELETE policies for all affected tables

-- expenses
CREATE POLICY "Users can delete their own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- sales
CREATE POLICY "Users can delete their own sales"
  ON public.sales FOR DELETE
  USING (auth.uid() = user_id);

-- cash_flow
CREATE POLICY "Users can delete their own cash flow entries"
  ON public.cash_flow FOR DELETE
  USING (auth.uid() = user_id);

-- notas_fiscais
CREATE POLICY "Users can delete their own invoices"
  ON public.notas_fiscais FOR DELETE
  USING (auth.uid() = user_id);

-- pix_charges
CREATE POLICY "Users can delete their own PIX charges"
  ON public.pix_charges FOR DELETE
  USING (auth.uid() = user_id);

-- profiles
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- nota_fiscal_items (child table - check parent ownership)
CREATE POLICY "Users can delete items from their own invoices"
  ON public.nota_fiscal_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.notas_fiscais
    WHERE notas_fiscais.id = nota_fiscal_items.nota_fiscal_id
    AND notas_fiscais.user_id = auth.uid()
  ));

-- sale_items (child table - check parent ownership)
CREATE POLICY "Users can delete items from their own sales"
  ON public.sale_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.sales
    WHERE sales.id = sale_items.sale_id
    AND sales.user_id = auth.uid()
  ));
