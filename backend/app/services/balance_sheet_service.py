"""
资产负债表服务模块
"""

from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.base import Asset, Liability
from ..schemas import AssetCreate, AssetUpdate, LiabilityCreate, LiabilityUpdate


class BalanceSheetService:
    """资产负债表服务类"""

    def __init__(self, db: Session):
        self.db = db

    # 资产相关操作
    def get_assets(self) -> List[Asset]:
        """获取所有资产"""
        return self.db.query(Asset).order_by(Asset.created_at.desc()).all()

    def get_asset(self, asset_id: int) -> Optional[Asset]:
        """根据ID获取资产"""
        return self.db.query(Asset).filter(Asset.id == asset_id).first()

    def create_asset(self, asset: AssetCreate) -> Asset:
        """创建资产"""
        db_asset = Asset(
            name=asset.name,
            value=asset.value,
            category=asset.category
        )
        self.db.add(db_asset)
        self.db.commit()
        self.db.refresh(db_asset)
        return db_asset

    def update_asset(self, asset_id: int, asset_update: AssetUpdate) -> Optional[Asset]:
        """更新资产"""
        db_asset = self.get_asset(asset_id)
        if not db_asset:
            return None

        update_data = asset_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_asset, field, value)

        self.db.commit()
        self.db.refresh(db_asset)
        return db_asset

    def delete_asset(self, asset_id: int) -> bool:
        """删除资产"""
        db_asset = self.get_asset(asset_id)
        if not db_asset:
            return False

        self.db.delete(db_asset)
        self.db.commit()
        return True

    # 负债相关操作
    def get_liabilities(self) -> List[Liability]:
        """获取所有负债"""
        return self.db.query(Liability).order_by(Liability.created_at.desc()).all()

    def get_liability(self, liability_id: int) -> Optional[Liability]:
        """根据ID获取负债"""
        return self.db.query(Liability).filter(Liability.id == liability_id).first()

    def create_liability(self, liability: LiabilityCreate) -> Liability:
        """创建负债"""
        db_liability = Liability(
            name=liability.name,
            value=liability.value,
            category=liability.category
        )
        self.db.add(db_liability)
        self.db.commit()
        self.db.refresh(db_liability)
        return db_liability

    def update_liability(self, liability_id: int, liability_update: LiabilityUpdate) -> Optional[Liability]:
        """更新负债"""
        db_liability = self.get_liability(liability_id)
        if not db_liability:
            return None

        update_data = liability_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_liability, field, value)

        self.db.commit()
        self.db.refresh(db_liability)
        return db_liability

    def delete_liability(self, liability_id: int) -> bool:
        """删除负债"""
        db_liability = self.get_liability(liability_id)
        if not db_liability:
            return False

        self.db.delete(db_liability)
        self.db.commit()
        return True

    # 综合数据
    def get_balance_sheet_data(self):
        """获取完整的资产负债表数据"""
        assets = self.get_assets()
        liabilities = self.get_liabilities()
        return {
            "assets": assets,
            "liabilities": liabilities
        }
