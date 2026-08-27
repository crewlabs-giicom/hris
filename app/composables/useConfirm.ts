import Swal from 'sweetalert2'

/**
 * Themed SweetAlert2 confirm dialog — replaces browser `confirm()`. Confirm button uses
 * the same orange gradient as the topbar; destructive actions get a solid red instead.
 */
export function useConfirm() {
  async function confirm(options: {
    title: string
    text?: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
  }) {
    const result = await Swal.fire({
      title: options.title,
      text: options.text,
      icon: options.danger ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: options.confirmText ?? 'Yes',
      cancelButtonText: options.cancelText ?? 'Cancel',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-xl font-sans',
        title: 'text-ink text-[16px]',
        htmlContainer: 'text-ink-soft text-[13px]',
        confirmButton: 'px-4 py-2 rounded-md text-white text-[13px] font-semibold mx-1.5',
        cancelButton: 'px-4 py-2 rounded-md border border-line bg-white text-ink text-[13px] font-semibold mx-1.5',
      },
      didOpen: (popup) => {
        const confirmButton = popup.querySelector('.swal2-confirm') as HTMLElement | null
        if (confirmButton) {
          confirmButton.style.background = options.danger ? '#ef4444' : 'linear-gradient(to right, #ff9b44, #fc6075)'
          confirmButton.style.border = 'none'
        }
      },
    })
    return result.isConfirmed
  }

  return { confirm }
}
