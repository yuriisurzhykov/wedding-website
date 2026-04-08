'use client'

import Image from 'next/image'

import type {WishView} from '@entities/wish'
import {cn} from '@shared/lib/cn'

type WishesFeedProps = {
    wishes: WishView[]
    className?: string
}

export function WishesFeed({wishes, className}: WishesFeedProps) {
    if (wishes.length === 0) {
        return null
    }

    return (
        <ul className={cn('mt-10 flex flex-col gap-6', className)}>
            {wishes.map((w) => (
                <li
                    key={w.id}
                    className="rounded-card border border-border bg-bg-section p-5 shadow-card"
                >
                    <p className="font-medium text-text-primary">{w.authorName}</p>
                    <p className="mt-2 whitespace-pre-wrap text-body text-text-secondary">
                        {w.message}
                    </p>
                    {w.photoUrl ? (
                        <div className="relative mt-4 overflow-hidden rounded-card">
                            <Image
                                src={w.photoUrl}
                                alt=""
                                aria-hidden
                                fill
                                sizes="128px"
                                quality={25}
                                className="pointer-events-none z-0 origin-center scale-110 object-cover blur-3xl brightness-90 saturate-150"
                            />
                            <div className="relative z-10 flex justify-center p-2 sm:p-3">
                                <Image
                                    src={w.photoUrl}
                                    alt=""
                                    width={1600}
                                    height={1600}
                                    sizes="(max-width: 640px) 100vw, 36rem"
                                    quality={80}
                                    className="relative h-auto max-h-72 w-auto max-w-full object-contain sm:max-h-96"
                                />
                            </div>
                        </div>
                    ) : null}
                </li>
            ))}
        </ul>
    )
}
