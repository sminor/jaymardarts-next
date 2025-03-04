import React from 'react';

export interface InfoItem {
    id: string;
    content: React.ReactNode;
}

interface InfoModalProps {
    items: InfoItem[];
}

const InfoModal: React.FC<InfoModalProps> = ({ items }) => {
    return (
        <div>
            {items.map((item) => ( // loop over items array
              <div key={item.id}>{item.content}</div> // display content of each item
            ))}
        </div>
    );
};

export default InfoModal;
