
import { useMutation as useTanstackMutation, UseMutationOptions, useQueryClient, QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';

interface MutationConfig<TData, TError, TVariables, TContext>
    extends UseMutationOptions<TData, TError, TVariables, TContext> {
    invalidateKeys?: QueryKey[];
    successMessage?: string;
    errorMessage?: string;
}

export function useMutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    config: MutationConfig<TData, TError, TVariables, TContext> = {}
) {
    const queryClient = useQueryClient();
    const { invalidateKeys, successMessage, errorMessage, onSuccess, onError, ...rest } = config;

    return useTanstackMutation({
        mutationFn,
        onSuccess: async (data, variables, context) => {
            if (invalidateKeys) {
                await Promise.all(
                    invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
                );
            }

            if (successMessage) {
                toast.success(successMessage);
            }

            if (onSuccess) {
                onSuccess(data, variables, context);
            }
        },
        onError: (error, variables, context) => {
            if (errorMessage) {
                toast.error(errorMessage);
                console.error(errorMessage, error);
            } else {
                console.error('Mutation failed:', error);
                toast.error("Something went wrong. Please try again.");
            }

            if (onError) {
                onError(error, variables, context);
            }
        },
        ...rest,
    });
}
