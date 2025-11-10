import { useEffect, useRef } from "react";
import { type Mode, useWatch } from "react-hook-form";
import { useDynzFormContext } from "../hooks";

type DependencyTriggerProps = {
  path: string;
  dependencies: string[];
  mode?: Mode | undefined;
  reValidateMode?: Exclude<Mode, 'onTouched' | 'all'>
};

/**
 * DependencyTrigger Component
 *
 * A utility component that automatically re-validates a form field whenever its dependencies change.
 *
 * @example
 * ```tsx
 * // Re-validate password confirmation when password changes
 * <DependencyTrigger
 *   path="confirmPassword"
 *   dependencies={["password"]}
 * />
 *
 * // Re-validate end date when start date changes
 * <DependencyTrigger
 *   path="endDate"
 *   dependencies={["startDate"]}
 *   mode="onChange"
 * />
 *
 * // Multiple dependencies
 * <DependencyTrigger
 *   path="total"
 *   dependencies={["quantity", "price"]}
 * />
 * ```
 *
 * @param path - The field path to trigger validation for when dependencies change
 * @param dependencies - Array of field paths to watch for changes
 * @param mode - Validation strategy before submitting behaviour.
 *               Defaults to "onSubmit".
 * @param reValidateMode - Validation strategy after submitting behaviour.
 *                         Defaults to 'onChange' 
 *
 * @returns null - This component renders nothing to the DOM
 *
 * @remarks
 * - The component skips validation on the initial render to avoid unnecessary validation
 * - When mode is "onSubmit", validation only occurs after form submission
 * - Uses React Hook Form's `useWatch` to efficiently track dependency changes
 * - Should be placed inside a form context (DynzFormProvider or FormProvider)
 */
export function DependencyTrigger({ path, dependencies, mode = 'onSubmit', reValidateMode = 'onChange' }: DependencyTriggerProps) {
  const {
    control,
    trigger,
    subscribe,
    formState: { isSubmitted },
  } = useDynzFormContext();

  const firstRender = useRef(true);

  const value = useWatch({
    name: dependencies,
    control,
  });
console.log('saayy whut?', JSON.stringify(dependencies), '<<<')
  // biome-ignore lint/correctness/useExhaustiveDependencies: need to watch value change
  useEffect(() => {
 console.log('hahawhoootsshahaha', dependencies)
    // make sure to unsubscribe;
    const callback = subscribe({
      name: dependencies,
      callback: (all) => {
        console.log('hahahahaha')
        console.log(all)
      },
    })

    return () => callback()

    // if(firstRender.current === true) {
    //   firstRender.current = false;
    //   return
    // }

    // if(isSubmitted && )

    // if (firstRender.current === false && mode !== "onSubmit" || isSubmitted) {
    //   trigger(path);
    // }
    
    
  }, [value, trigger, path, isSubmitted, mode]);

  return null;
}
